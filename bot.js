const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

const BOT_IMG = "/boticon.svg";
const PERSON_IMG = "/usericon.svg";
const LOADING_IMG = "/loading.svg";
const BOT_NAME = "Chatbot";
const PERSON_NAME = "You";
const INIT_MSG = "Hi, I'm Chatbot! How can I help you? 😄";

// set greeting message
appendMessage(BOT_NAME, BOT_IMG, "left", INIT_MSG);

msgerForm.addEventListener("submit", event => {
    event.preventDefault();

    const msgText = msgerInput.value;
    if (!msgText) return;

    appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);

    var responseId = uuid.v4();
    botResponseStream(responseId);
});

function appendMessage(name, img, side, text, responseId) {
    const parsedHTML = marked.parse(text);
    const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text" id="${responseId}">
            <span name="show">
                ${parsedHTML}
            </span>
            <span name="hide" style="display: none;">${text}</span>
        </div>
      </div>
    </div>
  `;

    msgerChat.insertAdjacentHTML("beforeend", msgHTML);
    msgerChat.scrollTop += 500;
}

function refreshResponseDiv(responseId, text, finished){
    var responseDiv = document.getElementById(responseId);
    let showSpan = responseDiv.querySelector('span[name="show"]');
    let hideSpan = responseDiv.querySelector('span[name="hide"]');

    hideSpan.textContent += text;
    showSpan.innerHTML = marked.parse(hideSpan.textContent) + `<div name="loading-gif" class="msg-loading" style="background-image: url(${LOADING_IMG})"></div>`;
    msgerChat.scrollTop += 500;
    if (finished) {
        let loading = showSpan.querySelector('div[name="loading-gif"]');
        loading.remove();
    }
}

async function botResponseStream(responseId) {
    const messages = buildMessages();
    msgerInput.value = "";
    appendMessage(BOT_NAME, BOT_IMG, "left", "", responseId);
    refreshResponseDiv(responseId, "");
    const result = await fetch('/chatResponse', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ messages })
                    });
    const reader = result.body.getReader(); 
    const decoder = new TextDecoder(); 

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            console.log('Stream end.');
            break;
        }

        refreshResponseDiv(responseId, decoder.decode(value));
    }
    refreshResponseDiv(responseId, "", true);
    console.log('Reponse end.');
    // Get all the links in the webpage
    const links = document.querySelectorAll('a');

    // Loop through each link and set the target attribute to "_blank"
    links.forEach(link => {
        link.setAttribute('target', '_blank');
    });
}

function buildMessages() {
  let messages = Array.from(msgerChat.querySelectorAll('.msg')).map(msg => {
      let role = msg.classList.contains('right-msg') ? 'user' : 'assistant';
      let content = msg.querySelector('.msg-text').querySelector('span').textContent;
      return {role, content};
  });

  return messages;
}

// Utils
function get(selector, root = document) {
    return root.querySelector(selector);
}

function formatDate(date) {
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();

    return `${h.slice(-2)}:${m.slice(-2)}`;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}