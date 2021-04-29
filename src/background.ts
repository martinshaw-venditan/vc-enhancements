// Listen to messages sent from other parts of the extension. (commented out for future use with IPC)
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     // onMessage must return "true" if response is async.
//     let isResponseAsync = false;
//
//     if (request.popupMounted) {
//         console.log('background notified that Popup.tsx has mounted.');
//     }
//
//     return isResponseAsync;
// });

const urlRegexes = [
    /^.*\.venditan\.com\/LayoutBlockInstance.*$/,
    /^.*\.venditan\.com\/LayoutTemplate.*$/,
    /^.*\.venditan\.com\/CMSContentTemplate.*$/,
    /^.*\.venditan\.com\/LayoutBlockTemplate.*$/,
];

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, currentTab) {
    if (changeInfo.status == 'complete' && currentTab.active) {
        const isCMSTabUrl = urlRegexes.map(regex => regex.test(currentTab.url)).filter(v => v).length > 0;

        if (isCMSTabUrl) {
            chrome.tabs.executeScript(currentTab.id, {file: 'js/app.js'}, function (result: any) {
                return result;
            });
        }
    }
});

