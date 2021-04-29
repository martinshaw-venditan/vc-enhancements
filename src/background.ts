import TabChangeInfo = chrome.tabs.TabChangeInfo;
import Tab = chrome.tabs.Tab;
import InjectDetails = chrome.tabs.InjectDetails;
import VCEnhancementsApp from "./app/app";

// Listen to messages sent from other parts of the extension.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // onMessage must return "true" if response is async.
    let isResponseAsync = false;

    if (request.popupMounted) {
        console.log('background notified that Popup.tsx has mounted.');
    }

    return isResponseAsync;
});

const urlRegexes = [
    /^.*\.venditan\.com\/LayoutBlockInstance.*$/,
    /^.*\.venditan\.com\/LayoutTemplate.*$/,
    /^.*\.venditan\.com\/CMSContentTemplate.*$/,
    /^.*\.venditan\.com\/LayoutBlockTemplate.*$/,
];

let prepareTab = function (result: any) {
    let app = new VCEnhancementsApp();
}

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, currentTab) {
    // alert([tabId,changeInfo.status, currentTab.active]);
    if (changeInfo.status == 'complete' && currentTab.active) {
        const isCMSTabUrl = urlRegexes.map(regex => regex.test(currentTab.url)).filter(v => v).length > 0;
        // alert([isCMSTabUrl, currentTab.url, urlRegexes.map(regex => regex.test(currentTab.url))]);

        if (isCMSTabUrl) {
            chrome.tabs.executeScript(
                currentTab.id,
                {
                    file: 'app.js'
                },
                prepareTab
            );
            // chrome.tabs.executeScript(
            //     currentTab.id,
            //     {
            //         file: 'app.css'
            //     },
            //     prepareTab
            // );
        }
    }
});

