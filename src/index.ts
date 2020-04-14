import Graphics from "./graphics";
import { Vector, Vector2d } from "./vector";
import { Entity2d } from "./entity";

let win:any;
let started:boolean = false;
let setup:(Function|undefined);
let loop:(Function|undefined);
let winClosed:boolean=false;

const errIfNotStart=():void=>{
    if(!started) throw new Error("Can't call this method before the app starts");
};

const send = (channel: string, data?: any):void => {
    errIfNotStart();
    if(winClosed)return;
    win.webContents.send(channel,data);
};

const Window = {
    width:0,
    height:0,
    /**
     * Resize the window.
     * @param {number} w the window's new width.
     * @param {number} h the window's new height.
     * @returns {void}
     */
    size(w:number,h:number){
        errIfNotStart();
        if(winClosed)return;
        win.setSize(w,h);
        send("resize");
        this.width=w;
        this.height=h;
    },
    /**
     * Reposition the window
     * @param {number} x 
     * @param y 
     */
    position(x:number,y:number){
        errIfNotStart();
        if(winClosed)return;
        win.setPosition(x,y);
    },
    /**
     * Centers the window in the middle of the screen
     * @returns {void}
     */
    center(){
        errIfNotStart();
        if(winClosed)return;
        win.center();
    },
    /**
     * Maximize the size of the window
     * @returns {void}
     */
    maximize(){
        errIfNotStart();
        if(winClosed)return;
        win.maximize();
        send("resize");
        let bounds=win.webContents.getOwnerBrowserWindow().getBounds()
        this.width=bounds.width;
        this.height=bounds.height;
    },
    Graphics:new Graphics()
};

const Keyboard = {
    keys:{} as {[key:string]:boolean},
    /**
     * Returns true if the key is down otherwise false
     * @param {(string|number)} code the ascii value or name of the key
     * @returns {boolean}
     */
    isKeyDown(code:(string|number)):boolean{
        return !!this.keys[code];
    }
};

const Mouse = new Vector2d();

function start():void {
    const { app, BrowserWindow, ipcMain } = require("electron");
    app.on('ready', () => {
        win=new BrowserWindow({
            frame: false,
            webPreferences: {
                nodeIntegration: true
            }
        });
        win.loadFile(`${__dirname}/../render/.html`);
        win.on("closed",()=>winClosed=true);
        let size=win.getSize();
        Window.width=size[0];
        Window.height=size[1];
        ipcMain.on("ready", () => {
            if (setup instanceof Function) setup();
            frame();
        });
        ipcMain.on("keyboard",(e:any,data:{code:number, state:boolean})=>{
            Keyboard.keys[data.code]=data.state;
            if(data.code>=65&&data.code<=90)Keyboard.keys[String.fromCharCode(data.code).toLowerCase()]=data.state;
        });
        ipcMain.on("mousemove",(e:any,data:{x:number,y:number})=>{
            Mouse.x=data.x;
            Mouse.y=data.y;
        });
        started = true;
    });
};

function frame () {
    if(loop instanceof Function)loop();
    send("graphic-instructions",Window.Graphics.instructions);
    Window.Graphics.instructions=[];
    if(!winClosed)setTimeout(frame,1000/30);
};

/**
 * Run the game engine.
 * @param {object} options the configuration of the game.
 * @param {Function} options.setup a function that's called when the game starts.
 * @param {Function} options.loop a function that's called each frame.
 */
export function run(options: { setup?: Function, loop?: Function }) {
    if(started)throw new Error("The app has already started")
    start();
    setup=options.setup;
    loop=options.loop;
    return {
        Keyboard,
        Window,
        Mouse
    };
};

export {
    Vector,
    Vector2d,
    Entity2d
};