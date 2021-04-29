import './app.scss';
import * as monaco from "monaco-editor";

class VCEnhancementsApp {
    constructor() {
        (function() {

            // just place a div at top right
            var div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.right = '0';
            div.id="abcdef";
            div.textContent = 'Injected!';
            document.body.appendChild(div);

            var monacoEditorContainer = document.getElementById("abcdef");
            if (monacoEditorContainer) {
                monaco.editor.create(monacoEditorContainer, {
                    value: 'console.log("Hello, world")',
                    language: 'javascript'
                });
            }

        })();
    }
}

export default VCEnhancementsApp;
