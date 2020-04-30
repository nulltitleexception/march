import bent from 'bent';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import pug from 'pug';
import * as stylus from 'stylus';
import { File } from '../system/file';
import { launch_id, version } from '../version';
import http = require('http');
import https = require('https');
import path = require('path');
import octicons = require('@primer/octicons');
import socketIO = require('socket.io');


const LINKS: { [id: string]: string } = {
    'github': 'https://github.com/phi-fell/march',
    'bugs': 'https://github.com/phi-fell/march/issues',
};

export class WebServerOptions {
    public http_port: number = 80;
    public https_port: number = 443;
    public use_https: boolean = true;
    public unlock_diagnostic: boolean = false;
    public useDebugJS: boolean = false;
    public static_site: boolean = false;
    public https_key: string = '';
    public https_cert: string = '';
    public clone(): WebServerOptions {
        const ret = new WebServerOptions();
        ret.http_port = this.http_port;
        ret.https_port = this.https_port;
        ret.use_https = this.use_https;
        ret.unlock_diagnostic = this.unlock_diagnostic;
        ret.useDebugJS = this.useDebugJS;
        ret.static_site = this.static_site
        ret.https_key = this.https_key;
        ret.https_cert = this.https_cert;
        return ret;
    }
}

export class WebServer {
    private options: WebServerOptions;
    private express_app: any;
    private redirect_app: any | null = null;
    private http_server: http.Server;
    private https_server: https.Server | null = null;
    private socketIO: SocketIO.Server;
    private jqueryjs: string | undefined;
    private vuejs: string | undefined;
    constructor(opts: WebServerOptions) {
        this.options = opts.clone();
        const ws = this;
        (async () => {
            try {
                const loadJQuery = bent('https://code.jquery.com', 'string');
                ws.jqueryjs = await (
                    (ws.options.useDebugJS)
                        ? loadJQuery('/jquery-3.4.1.js')
                        : loadJQuery('/jquery-3.4.1.min.js')
                );
            } catch (error) {
                console.log('could not GET jquery.js:');
                console.log(error);
            }
            try {
                const loadVue = bent('https://cdn.jsdelivr.net', 'string');
                ws.vuejs = await (
                    (ws.options.useDebugJS)
                        ? loadVue('/npm/vue/dist/vue.js')
                        : loadVue('/npm/vue')
                );
            } catch (error) {
                console.log('could not GET vue.js:');
                console.log(error);
            }
        })();
        this.express_app = express();
        this.express_app.use(cookieParser());
        this.express_app.use(express.json());
        if (this.options.use_https) {
            const options = {
                'key': this.options.https_key,
                'cert': this.options.https_cert,
            };

            this.https_server = https.createServer(options, this.express_app);
            this.socketIO = socketIO(this.https_server, { 'transports': ['websocket'] });

            this.redirect_app = express();
            this.http_server = http.createServer(this.redirect_app);

            this.redirect_app.get('*', (req: Request, res: Response) => {
                res.redirect('https://' + req.headers.host + req.url);
            });
        } else {
            this.http_server = http.createServer(this.express_app);
            this.socketIO = socketIO(this.http_server, { 'transports': ['websocket'] });
        }
        this.attachWebRoutes();
    }
    public shutdown() {
        if (this.options.use_https) {
            this.https_server?.close();
            this.http_server.close();
        } else {
            this.http_server.close();
        }
    }
    public listen() {
        if (this.options.use_https) {
            this.https_server?.listen(this.options.https_port, () => {
                console.log('GotG V' + version + ' Launch_ID[' + launch_id + ']');
                console.log('listening on *:' + this.options.https_port);
            });
            this.http_server.listen(this.options.http_port);
        } else {
            this.http_server.listen(this.options.http_port, () => {
                console.log('GotG V' + version + ' Launch_ID[' + launch_id + ']');
                console.log('listening on *:' + this.options.http_port);
            });
        }
    }
    public getSocketIO() {
        return this.socketIO;
    }
    private attachWebRoutes() {
        this.express_app.get('/', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/index.pug')));
        });

        this.express_app.get('/dependencies/jquery.js', async (req: Request, res: Response) => {
            if (this.jqueryjs) {
                res.send(this.jqueryjs);
            } else {
                res.sendFile(path.resolve('dev_fallback/jquery.js'));
            }
        });
        this.express_app.get('/dependencies/vue(.js)?', async (req: Request, res: Response) => {
            if (this.vuejs) {
                res.type('this.express_application/javascript').send(this.vuejs);
            } else {
                res.sendFile(path.resolve('dev_fallback/vue.js'));
            }
        });

        this.express_app.get('/favicon.ico', (req: Request, res: Response) => {
            res.sendFile(path.resolve('site/logo/favicon.ico'));
        });

        const html_pages = ['test', 'game', 'login', 'home', 'character_creation', 'create'];
        if (this.options.static_site) {
            for (const page of html_pages) {
                this.express_app.get(`/${page}`, (req: Request, res: Response) => {
                    res.sendFile(path.resolve(`site/html/${page}.html`));
                });
            }
        } else {
            for (const page of html_pages) {
                this.express_app.get(`/${page}`, (req: Request, res: Response) => {
                    res.send(pug.renderFile(path.resolve(`site/pug/${page}.pug`)));
                });
            }
        }

        this.express_app.get('/css/:filename', async (req: Request, res: Response) => {
            try {
                stylus.render(
                    (await File.getReadOnlyFile(`site/stylus/${req.params.filename}.styl`)).getString(),
                    {
                        'filename': req.path,
                        'paths': ['site/stylus'],
                    },
                    (err, css) => {
                        if (err) {
                            console.log(err);
                            res.send(err);
                        } else {
                            res.setHeader('Content-Type', 'text/css');
                            res.send(css);
                        }
                    },
                );
            } catch (e) {
                console.log(e);
                res.sendStatus(404)
            }
        });

        this.express_app.use('/js', (req: Request, res: Response) => {
            res.sendFile(path.resolve(`site/js${req.path}${req.path.endsWith('.js') ? '' : '.js'}`));
        });
        this.express_app.use('/vue', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve(`site/vue${req.path}.pug`)));
        });

        this.express_app.use('/link/:link', (req: Request, res: Response, next: NextFunction) => {
            const link = req.params.link;
            if (LINKS[link]) {
                res.redirect(LINKS[link]);
            } else {
                res.sendStatus(404);
            }
        });

        const MAX_ARGS = 10;
        const seperator = '-';
        const color_mapper = (val: string) => {
            return (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(val)) ? ('#' + val) : val;
        }
        const attr_map: { [id: string]: (val: string) => string } = {
            'fill': color_mapper,
            'stroke': color_mapper,
        };
        const names: string[] = [...Array(MAX_ARGS).keys()].map((i: number) => 'arg' + i);
        this.express_app.use('/svg/octicon/:name/:' + names.join('?/:') + '?', (req: Request, res: Response, next: NextFunction) => {
            const icon = octicons[req.params.name];
            if (icon) {
                const attr: any = { 'xmlns': 'http://www.w3.org/2000/svg' }
                names.forEach((name) => {
                    const p = req.params[name];
                    if (p) {
                        if (!(/^[0-9a-zA-Z-_]+$/.test(p))) {
                            res.sendStatus(404);
                            return;
                        }
                        const ps = p.split(seperator);
                        const id = ps[0];
                        const val = ps.slice(1).join(seperator);
                        const mapper = attr_map[id];
                        if (mapper) {
                            attr[id] = mapper(val);
                        }
                    }
                });
                res.setHeader('Content-Type', 'image/svg+xml');
                res.send(icon.toSVG(attr));

            } else {
                res.sendStatus(404);
            }
        });

        this.express_app.use('/tex', express.static(path.resolve('site/tex')));
        this.express_app.use(express.static(path.resolve('public')));
    }

}
