import './app.scss';
import {v4 as uuidv4} from 'uuid';
import CodeMirror from "codemirror";
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/idea.css';
import 'codemirror/mode/php/php.js';
import 'codemirror/mode/javascript/javascript.js';

interface EditorAddon extends CodeMirror.EditorConfiguration {
    height?: string;
    lineNumbers?: boolean;
    autoRefresh?: boolean;
    showTrailingSpace?: boolean;
}

interface CodeMirrorLanguageMode {
    name?: string,
    json?: boolean,
}

class VCEnhancementsApp {
    private editors: Array<CodeMirror.EditorFromTextArea> = [];

    private paths = [
        { test: /^.*\.venditan\.com\/LayoutBlockInstance.*$/, type: 'LayoutBlockInstance' },
        { test: /^.*\.venditan\.com\/LayoutTemplate.*$/, type: 'LayoutTemplate' },
        { test: /^.*\.venditan\.com\/CMSContentTemplate.*$/, type: 'CMSContentTemplate' },
        { test: /^.*\.venditan\.com\/LayoutBlockTemplate.*$/, type: 'LayoutBlockTemplate' },
    ];

    private pageType = '';

    constructor() {
        const self = this;
        VCEnhancementsApp.ready(function () {
            self.determinePageType();
            self.setupEditors();
            self.setupJumpLinks();
        });
    }

    private determinePageType () {
        const self = this;
        self.paths.forEach(function (path) {
            if (path.test.test(window.location.href)) {
                self.pageType = path.type;
            }
        });
    }

    private setupEditors () {
        const self = this;

        let editors: NodeListOf<any>;
        if (self.pageType == 'LayoutBlockInstance' || self.pageType == 'LayoutTemplate' ||  self.pageType == 'LayoutBlockTemplate') {
            editors = document.getElementById('content_wrap')
                .getElementsByClassName('span8')[0]
                .querySelectorAll('textarea.code_textarea');
        } else if (self.pageType == 'CMSContentTemplate') {
            editors = document.getElementById('content_wrap')
                .querySelector('form#edit_template_form')
                .querySelectorAll('textarea.code_textarea');
        }

        editors.forEach(function(element: HTMLElement) {
            const id = uuidv4();
            element.id = id;

            const label = (element.previousElementSibling as HTMLDivElement).innerText;
            let lang: CodeMirrorLanguageMode = {name: 'php'};
            switch (label) {
                case 'Config (JSON)': lang = {name: 'javascript', json: true}; break;
                // ...
            }

            const editorConfig: CodeMirror.EditorConfiguration & EditorAddon = {
                height: '350px',
                lineNumbers: true,
                mode: lang,

            };
            self.editors.push(CodeMirror.fromTextArea(
                document.getElementById(id) as HTMLTextAreaElement,
                editorConfig
            ));
        });
    }

    private setupJumpLinks () {
        const self = this;
        if (self.pageType == 'LayoutBlockTemplate') {
            let list = document.querySelectorAll('form#linked_template_form label');
            list.forEach(function (element) {
                let link = document.createElement(    'a');
                let id = element.querySelector('input').value;
                link.href = '/LayoutTemplate/view/id/' + id;
                link.innerHTML = '#'+id+' &rarr;';
                link.target = "_blank";
                link.className = 'jumplink';
                element.appendChild(link);
            });
        }
        if (self.pageType == 'LayoutTemplate') {
            let list = document.querySelectorAll('form#linked_template_form label');
            list.forEach(function (element) {
                let link = document.createElement(    'a');
                let id = element.querySelector('input').value;
                link.href = '/LayoutBlockTemplate/view/id/' + id;
                link.innerHTML = '#'+id+' &rarr;';
                link.target = "_blank";
                link.className = 'jumplink';
                element.appendChild(link);
            });
        }
    }

    private static ready (callback) {
        // see if DOM is already available
        if (document.readyState === "complete" || document.readyState === "interactive") {
            // call on next available tick
            setTimeout(callback, 1);
        } else {
            document.addEventListener("DOMContentLoaded", callback);
        }
    }
}

let app = new VCEnhancementsApp();
export default app;
