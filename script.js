// ==UserScript==
// @name         YouTube auto replay on mobile
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Auto replay video option on mobile version
// @author       lxst-one
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=YouTube.com
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const optionHTML = '<div class="auto-replay-content">Auto replay</div><button id="btn-auto-replay" class="c3-material-toggle-button" aria-label="Auto replay" aria-pressed="false"><div class="c3-material-toggle-button-track"></div><div class="c3-material-toggle-button-circle"></div></button>';
    var autoReplay = false;
    var bodyObserver = null;
    var videoObserver = null;
    var urlObserver = null;
    var urlChangedEvent = null;

    function main() {
        createUrlChangedEvent();
        initUrlObserver();

        document.addEventListener('url-changed', (e) => {
            if(bodyObserver) {
                bodyObserver.disconnect();
            }

            if(videoObserver) {
               videoObserver.disconnect();
            }

            initBodyObserver();
            initVideoObserver();
        });

        dispatchUrlChangedEvent();
    }

    function createUrlChangedEvent() {
        urlChangedEvent = new CustomEvent('url-changed');
    }

    function dispatchUrlChangedEvent() {
        if(urlChangedEvent === null) {
           console.log('Failed to dispatch url changed event');
           return;
        }

        document.dispatchEvent(urlChangedEvent);
    }

    function initUrlObserver() {
        let currentUrl = window.location.href;
        setInterval(() => {
            if(currentUrl != window.location.href) {
                currentUrl = window.location.href;
                dispatchUrlChangedEvent();
            }
        }, 700);
    }

    function insertAutoReplayOption() {
        if(document.querySelector('div.auto-replay-setting')) {
            //Already exists
            return;
        }

        let dialogBody = document.querySelector('[id^="dialog-body:"]');

        if(dialogBody === null) {
            console.log('Failed to insert auto replay option');
            return;
        }

        let optionNode = document.createElement('div');
        optionNode.classList.add('auto-replay-setting');
        optionNode.style.cssText = 'display:-moz-box;display:flex;-moz-box-pack:justify;justify-content:space-between;margin-bottom:8px;padding:8px 0;';
        optionNode.innerHTML = optionHTML.trim();

        dialogBody.insertBefore(optionNode, dialogBody.firstChild);

        setAutoReplayButtonState();
        initAutoReplayButtonEvent();
    }

    function clickAutoReplayButton(button) {
        autoReplay = !(button.getAttribute('aria-pressed') === 'true');
        setAutoReplayButtonState();
    }

    function initBodyObserver() {
        bodyObserver = new MutationObserver((mutations) => {
            mutations.some((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if(node.tagName === 'DIV' && node.classList.contains('dialog-container')) {
                        insertAutoReplayOption();
                    }
                });
            });
        });

        bodyObserver.observe(document.body, {childList: true});
    }

    function initAutoReplayButtonEvent() {
        let button = document.getElementById('btn-auto-replay');
        if(button === null) {
            console.log('Auto replay button not found!');
            return;
        }

        button.addEventListener('click', () => clickAutoReplayButton(button));
    }

    function setAutoReplayButtonState() {
        let button = document.getElementById('btn-auto-replay');
        if(button === null) {
            console.log('Auto replay button not found!');
            return;
        }

        button.setAttribute('aria-pressed', autoReplay)
    }

    function initVideoObserver() {
        let videoContainer = document.querySelector('div#movie_player');
        if(videoContainer === null) {
            return;
        }

        videoObserver = new MutationObserver((mutations) => {
            mutations.some((mutation) => {
                if(autoReplay && mutation.target.classList.contains('ended-mode')) {
                    let replayBtn = document.querySelector('button.endscreen-replay-button');
                    if(replayBtn === null) return;

                    replayBtn.click();
                }
            });
        });

        videoObserver.observe(videoContainer, {attributeFilter: ['class']});
    }

    main();
})();