import './app.scss';
import * as monaco from "monaco-editor";

// @ts-ignore
self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return './json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return './css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return './ts.worker.js';
        }
        return './editor.worker.js';
    }
};

class VCEnhancementsApp {
    constructor() {
        (function() {

            // just place a div at top right
            var div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.right = '0';
            div.textContent = 'Injected!';
            document.body.appendChild(div);

            alert(1);
            // var monacoEditorContainer = document.getElementById("abcdef");
            // if (monacoEditorContainer) {
            //     monaco.editor.create(monacoEditorContainer, {
            //         value: 'console.log("Hello, world")',
            //         language: 'javascript'
            //     });
            // }

        })();
    }
}

export default VCEnhancementsApp;
