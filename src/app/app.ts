import './app.scss';
import {v4 as uuidv4} from 'uuid';
import CodeMirror from "codemirror";
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/idea.css';
import 'codemirror/mode/php/php.js';
import 'codemirror/mode/javascript/javascript.js';

interface EditorConfiguration extends CodeMirror.EditorConfiguration {
    height?: string;
    lineNumbers?: boolean;
    autoRefresh?: boolean;
    showTrailingSpace?: boolean;
}

interface CodeMirrorLanguageMode {
    name?: string,
    json?: boolean,
}

interface DataEntry {
    name: string,
    value: string,
}

interface DataHistory {
    uuid: string,
    datetime: string,
    formData: Array<DataEntry>,
    descriptor: string
}

class VCEnhancementsApp {
    //CodeMirror.EditorFromTextArea
    private editors: object = {};

    private paths = [
        { test: /^.*\.venditan\.com\/LayoutBlockInstance.*$/, type: 'LayoutBlockInstance' },
        { test: /^.*\.venditan\.com\/LayoutTemplate.*$/, type: 'LayoutTemplate' },
        { test: /^.*\.venditan\.com\/CMSContentTemplate.*$/, type: 'CMSContentTemplate' },
        { test: /^.*\.venditan\.com\/LayoutBlockTemplate.*$/, type: 'LayoutBlockTemplate' },
    ];

    private pageType = '';
    private pageId = -1;

    private historyStore = {};

    constructor () {
        const self = this;
        VCEnhancementsApp.ready(function () {
            self.determinePageType();
            self.setupEditors();
            self.setupJumpLinks();
            self.setupHistory();
            self.setupDialogHandleAutoInput();
        });
    }

    private determinePageType = (): void => {
        const self = this;
        self.paths.forEach(function (path) {
            if (path.test.test(window.location.href)) {
                self.pageType = path.type;
            }
        });
        const pageIdFind = location.href.match(/^.*\/id\/([0-9]*).*$/);
        if (pageIdFind !== null) {
            this.pageId = parseInt(pageIdFind[1]);
        }
    };

    private setupEditors = (): void => {
        const self = this;

        let editorLocator: HTMLCollectionOf<Element>|NodeListOf<HTMLTextAreaElement>|Element;
        if (self.pageType == 'LayoutBlockInstance' || self.pageType == 'LayoutTemplate' ||  self.pageType == 'LayoutBlockTemplate') {
            editorLocator = document.getElementById('content_wrap').getElementsByClassName('span8');
            if (editorLocator.length <= 0) { return; }
            editorLocator = editorLocator[0].querySelectorAll('textarea.code_textarea');
        } else if (self.pageType == 'CMSContentTemplate') {
            editorLocator = document.getElementById('content_wrap').querySelector('form#edit_template_form');
            if (editorLocator === null) { return; }
            editorLocator = editorLocator.querySelectorAll('textarea.code_textarea');
        }

        (editorLocator as NodeListOf<HTMLTextAreaElement>).forEach(function(element: HTMLTextAreaElement) {
            const id = uuidv4();
            element.id = id;

            const label = (element.previousElementSibling as HTMLDivElement).innerText;
            let lang: CodeMirrorLanguageMode = {name: 'php'};
            switch (label) {
                case 'Config (JSON)': lang = {name: 'javascript', json: true}; break;
                // ...
            }

            const editorConfig: EditorConfiguration = {
                height: '350px',
                lineNumbers: true,
                mode: lang,
            };
            self.editors[id] = CodeMirror.fromTextArea(
                document.getElementById(id) as HTMLTextAreaElement,
                editorConfig
            );
        });
    };

    private setupJumpLinks = (): void => {
        const self = this;

        let linkTo: boolean|string = false;
        if (self.pageType == 'LayoutBlockTemplate') { linkTo = '/LayoutTemplate/view/id/'; }
        if (self.pageType == 'LayoutTemplate') { linkTo = '/LayoutBlockTemplate/view/id/'; }
        if (linkTo === false) { return; }

        let list = document.querySelectorAll('form#linked_template_form label');
        list.forEach(function (element: HTMLDivElement) {
            let link = document.createElement('a');
            let id = element.querySelector('input').value;
            link.href = linkTo + id;
            link.innerHTML = '#'+id+' &rarr;';
            link.target = "_blank";
            link.className = 'jumplink';
            link.title = "Open \""+element.innerText.slice(1,40)+"\" in a new tab...";
            element.appendChild(link);
        });
    };

    private setupHistory = (): void => {
        this.populateHistoryStore();

        let form: HTMLElement = document.getElementById('content_wrap').querySelector('form#edit_template_form');
        if (form === null) { return; }
        this.buildHistoryDOM(form);
    };

    private populateHistoryStore = (): void => {
        const config = localStorage.getItem('vce_historystore');
        this.historyStore = config === null ? {} : JSON.parse(config);
    };

    private updateHistoryStore = (): void => {
        localStorage.setItem('vce_historystore', JSON.stringify(this.historyStore));
    };

    private getCurrentHistory = (): Array<DataHistory> => {
        console.log(this.historyStore, this.pageType + '_' + this.pageId, this.historyStore[this.pageType + '_' + this.pageId]);
        const current = this.historyStore[this.pageType + '_' + this.pageId]
        return typeof current === 'undefined' ? [] : current;
    };

    private setCurrentHistory = (newSet: Array<DataHistory>): void => {
        this.historyStore[this.pageType + '_' + this.pageId] = newSet;
    };

    private buildHistoryDOM = (appendable: HTMLElement): HTMLDivElement => {
        const self = this;

        let dom = document.createElement('div');
        dom.className = 'vce_history_container';
        dom.innerHTML = `
            <button class="btn vce_history_store_btn">Store current config</button>
            <button class="btn vce_history_restore_btn">Restore previous config</button>
        `;
        appendable.append(dom);

        (dom.querySelector('button.vce_history_store_btn') as HTMLButtonElement).onclick = function (event: PointerEvent) {
            event.preventDefault();
            self.historyStoreButtonClickEvent(self);
        };

        (dom.querySelector('button.vce_history_restore_btn') as HTMLButtonElement).onclick = function (event: PointerEvent) {
            event.preventDefault();
            self.historyRestoreButtonClickEvent(self);
        }
        return dom;
    };

    private historyStoreButtonClickEvent = (context: VCEnhancementsApp): void => {
        let descriptor = prompt('Please enter a caption to describe the current configuration:');
        descriptor = descriptor === null ? '' : descriptor;
        let config : DataHistory = {
            uuid: uuidv4(),
            descriptor,
            datetime: new Date().toString(),
            formData: context.buildFormData(),
        }
        context.setCurrentHistory([...context.getCurrentHistory(), config]);
        context.updateHistoryStore();
    };

    private historyRestoreButtonClickEvent = (context: VCEnhancementsApp): void => {
        const self = this;

        console.log(context.getCurrentHistory());
        if (context.getCurrentHistory().length <= 0) {
            alert('You have not stored any previous configurations for this block!');
            return;
        }

        let old = document.querySelector('.vce_history_restore_container');
        if (old !== null) {
            old.remove();
        }

        let dom = document.createElement('div');
        dom.className = 'vce_history_restore_container';
        dom.innerHTML = `
            <select id="vce_history_restore_select">
                ${context.getCurrentHistory().map(item => `<option value="${item.uuid}">${item.descriptor === '' ? '' : item.descriptor + ' - '}${item.datetime}</option>`)}
            </select>
            <button class="btn" id="vce_history_restore_select">Restore</button>
        `;

        document.querySelector('.vce_history_container').append(dom);

        (dom.querySelector('button#vce_history_restore_select') as HTMLButtonElement).onclick = function (event: PointerEvent) {
            event.preventDefault();
            self.historyRestoreSelectEvent(self);
        }
    };

    private historyRestoreSelectEvent = (context: VCEnhancementsApp): void => {
        if (document.querySelector('#vce_history_restore_select') === null) {
            return;
        }
        if ((document.querySelector('#vce_history_restore_select') as HTMLSelectElement).value === '') {
            return;
        }
        context.populateFormData(context.getDataHistoryByUuid((document.querySelector('#vce_history_restore_select') as HTMLSelectElement).value));
    };

    private buildFormData = (): Array<DataEntry> => {
        const self = this;
        // @ts-ignore
        return [... document
            .getElementById('content_wrap')
            .querySelector('form#edit_template_form')
            .querySelectorAll('*[name]')
        ]
            .map(function (element) {
                if (element.disabled || element.readOnly) {
                    return false;
                }
                return element.tagName === 'TEXTAREA' ? {
                        'name': element.name,
                        'value': self.editors[element.id].getValue()
                    } : {
                        'name': element.name,
                        'value': element.value
                    };
            })
            .filter(item => item !== false);
    };

    private getDataHistoryByUuid = (uuid: string): DataHistory => (this.getCurrentHistory() as Array<DataHistory>).filter(item => item.uuid === uuid)[0];

    private populateFormData = (data: DataHistory): void => {
        const self = this;

        const form = document.querySelector('form#edit_template_form');
        data.formData.forEach(function (item) {
            let element = form.querySelector('*[name="'+item.name+'"]');
            if ((element as HTMLInputElement|HTMLTextAreaElement).disabled || (element as HTMLInputElement|HTMLTextAreaElement).readOnly) {
                return;
            }
            if (element.tagName === 'TEXTAREA') {
                (element as HTMLTextAreaElement).innerHTML = item.value;
                self.editors[(element as HTMLTextAreaElement).id].setValue(item.value);
            } else {
                (element as HTMLInputElement|HTMLSelectElement).value = item.value;
            }
        });
    };

    private setupDialogHandleAutoInput (): void|boolean {
        const self = this;
        document.addEventListener( 'keyup', function ( event: KeyboardEvent ) {
            const emitter: EventTarget = event.target;
            const parent: HTMLElement = (emitter as HTMLElement).parentElement;

            // Isn't a quick add content dialog with name and handle inputs
            if (
                (emitter as HTMLElement).getAttribute('name') !== 'name' ||
                // @ts-ignore
                [...parent.classList].indexOf('quick_create_form') < 0 ||
                parent.parentElement.className !== 'dialog_content' ||
                parent.querySelector('input[name="name"]') === null ||
                parent.querySelector('input[name="handle"]') === null
            ) {
                return false;
            }

            let nameInput = emitter as HTMLInputElement;
            let handleInput = parent.querySelector('input[name="handle"]') as HTMLInputElement;

            nameInput.autocomplete = 'off';
            handleInput.autocomplete = 'off';
            handleInput.value = self.handleSlugify(nameInput.value);
        });
    }

    private handleSlugify (input: string) : string {
        return input.toString().toLowerCase()
            .replace(/\s+/g, '_')           // Replace spaces with _
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '_')         // Replace multiple - with single -
            .replace(/\_\_+/g, '_')         // Replace multiple _ with single _
            .replace(/\_\-\_+/g, '_')       // Replace spaces separated by - with single _
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    private static ready = (callback): void => {
        // see if DOM is already available
        if (document.readyState === "complete" || document.readyState === "interactive") {
            // call on next available tick
            setTimeout(callback, 1);
        } else {
            document.addEventListener("DOMContentLoaded", callback);
        }
    };
}

let app: VCEnhancementsApp;
if (typeof (window as any).vce_instantiated === typeof undefined) {
    app = new VCEnhancementsApp();
    (window as any).vce_instantiated = true;
}
export default app;
