import { TextEditor, window } from "vscode";
import { post_to_services } from "../API/api_wrapper";
import { v4 as uuidv4 } from 'uuid'; 
import { start } from "repl";

export let instance : CurrentSessionVariables;

export interface Event {
    activityId: string,
    activityDuration: number | undefined, 
    startTime: string, 
    endTime:string | undefined,
    activityType: string
}

// copy - from another window?, paste, cut, delete | save, open, close | git updates
export interface spontaneousEvent {
    activityId: string,
    time: string, 
    activityType: string,
    contentLength: number | undefined
}

// debug, run, shell run | window focus (multiple windows?) 
// document changes (typing, generating code, comments)
export interface continuousEvent {
    activityId: string,
    activityDuration: number | undefined, 
    startTime: string, 
    endTime:string | undefined,
    activityType: string
}

// should also add window id here - there might be multiple windows open
//      and the user might copy-paste from another one of his windows 
// Add content length? -> for spontaneous activities such as typing, pasting, cutting, deleting, etc
//      To obtain statistics for how much code was generated, from external sources, etc

export class CurrentSessionVariables {

    // multiple debug sessions can be active at the same time
    private crt_debug_sessions: { [key: string]: Event} = {};
    private crt_exec_sessions: { [key: string]: Event} = {};

    // By design, the VS Code API only works within a single instance (or window).
    //private opened_windows : { [key: string]: boolean} = {};

    private crt_is_in_focus : boolean = true;
    private last_came_in_focus : Date = new Date();

    private crt_copied_text = ''; // source of copy??
    //private crt_pasted_text = '';

    public CurrentSessionVariables() {
        instance = this;

        //this.opened_windows = window.visibleTextEditors;
    }

    public getInstance() {
        return instance;

    }

    public getCopiedText() { return this.crt_copied_text; }
    public setCopiedText(text:string) { this.crt_copied_text = text; }

    public getLastCameInFocus() { return this.last_came_in_focus; }

    public getDict(type:string): { [key: string]: Event} {
        switch(type) {
            case "debug": {
                return this.crt_debug_sessions;
            }
            case "exec": {
                return this.crt_exec_sessions;
            }
            default:
                return {}
        }
    }

    public startSession(id:string, startTime:Date, type:string) {
        let dict : { [key: string]: Event} = this.getDict(type); // returns reference 

        const new_session: Event = this.createEvent(undefined, startTime, undefined, type)

        dict[id] = new_session;
    }

    public stopSession(id:string, endTime: Date, type:string) : Event {
        let dict : { [key: string]: Event} = this.getDict(type); // returns reference 

        const prev_session = dict[id];

        const start_date = new Date(prev_session.startTime)
        const seconds: number = timeDifference(start_date, endTime)

        const updated_debug_session : Event = this.createEvent(seconds, start_date, endTime, prev_session.activityType);
        
        delete dict[id];

        return updated_debug_session;
    }

    public createEvent(duration:number|undefined, start: Date, end: Date|undefined, type: string): Event {
        let end_string = undefined;
        if (end!=undefined)
            end_string = end.toISOString();

        const event : Event = {
            activityId: uuidv4(), // uuid for storing in database
            activityDuration: duration,
            startTime: start.toISOString(),
            endTime: end_string,
            activityType: type
        }

        return event;
    }
}

function timeDifference(date1:Date, date2:Date):number {
    const diffInMs = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(diffInMs / 1000);
}

export async function handleEvent(message:string, local_session_id: string, activityName:string, activityType: string, activityTime:Date) {
    window.showInformationMessage(message);

    // !! check what is name exactly
    const list = ["debug", "exec"];

    let event : Event|undefined = undefined;
    if (activityType in list) {
        if (activityType == "start") { // just started debug session
            instance.startSession(local_session_id, activityTime, activityName);
        }
        else {
            event = instance.stopSession(local_session_id, activityTime, activityName);
        }
    }
    else {

        event = instance.createEvent(undefined, activityTime, undefined, activityName)
    }

    if (event != undefined)
        await sendEvent(event);
}

export async function sendEvent(event:Event) {
    window.showInformationMessage(`${event.activityType}`);
    //await post_to_services('/activity', event);
}