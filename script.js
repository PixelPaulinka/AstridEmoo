const apiToken = 'cc0ff2a5996ae1e127e6223c09506fb53981bb9cafc39600ea5a909cdc4ee823';
const ApiUrl = 'https://api.together.xyz/v1/chat/completions';

async function analyzeEmotions(analysisType) {
    const text = document.getElementById('text-input').value.trim();
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const customInstruction = document.getElementById('custom-instruction').value.trim();

    if (!text) {
        resultDiv.innerHTML = '<div class="error">❗ Please enter text for analysis.</div>';
        return;
    }

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    const cleanedText = text.replace(/,/g, '');
    let prompt;

    if (analysisType === 'simple') {
        prompt = `Analyze the emotional tone of this text: "${cleanedText}"

Identify the primary emotion (joy, sadness, anger, fear, surprise, neutral).
Detect any secondary emotions present.
Evaluate the emotional intensity (low, medium, high).
Provide a brief explanation of what creates this emotional tone.
Avoid including the original text in your response, only the analysis.`;
    } else if (analysisType === 'advanced') {
        prompt = `Conduct a comprehensive emotional analysis of this text: "${cleanedText}

Provide your analysis in clear,see on genre, structured sections. Focus specifically on emotional content rather than other textual features. Do not include the original text in your response.`;
    }


    if (customInstruction) {
        prompt += ` Additional consideration: ${customInstruction}`;
    }

    const data = {
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500
    };

    try {
        const response = await fetch(ApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const responseData = await response.json();
        loadingDiv.style.display = 'none';
        displayEmotions(responseData);
    } catch (error) {
        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `<div class="error">⚠️ Error: ${error.message}</div>`;
    }
}

async function askQuestion() {
    const selectedText = window.getSelection().toString().trim();
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    if (!selectedText) {
        resultDiv.innerHTML = '<div class="error">❗ Please select text to ask a question.</div>';
        return;
    }

    const question = prompt('Enter your question about the selected text:');
    if (!question) {
        resultDiv.innerHTML = '<div class="error">❗ No question was entered.</div>';
        return;
    }

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    const promptText = `Text: "${selectedText}"\n\nQuestion: ${question}\n\nAnswer the question using the text context. Focus particularly on emotional aspects if relevant.`;

    const data = {
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        messages: [{ role: 'user', content: promptText }],
        max_tokens: 1000
    };

    try {
        const response = await fetch(ApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const responseData = await response.json();
        loadingDiv.style.display = 'none';
        displayQuestionAnswer(responseData);
    } catch (error) {
        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `<div class="error">⚠️ Error: ${error.message}</div>`;
    }
}

function displayQuestionAnswer(data) {
    const resultDiv = document.getElementById('result');
    if (!data || !data.choices || data.choices.length === 0) {
        resultDiv.innerHTML = '<div class="error">⚠️ Failed to get answer.</div>';
        return;
    }

    const answerText = data.choices[0].message.content;
    resultDiv.innerHTML = `
        <div class="analysis-container">
            <h2>📖 Answer:</h2>
            <div class="text-container">${answerText}</div>
        </div>
    `;
}

function displayEmotions(data) {
    const resultDiv = document.getElementById('result');
    if (!data || !data.choices || data.choices.length === 0) {
        resultDiv.innerHTML = '<div class="error">⚠️ Analysis failed.</div>';
        return;
    }

    const analysisText = data.choices[0].message.content;
    const formattedAnalysis = formatAnalysis(analysisText);

    resultDiv.innerHTML = `
        <div class="analysis-container">
            <h2>📖 Analysis Results:</h2>
            ${formattedAnalysis}
        </div>
    `;
}

function formatAnalysis(text) {
    const cleanedText = text
        .replace(/[^\p{L}\p{N}\s.,!?\-:]/gu, '')
        .replace(/^\s*[\d\-*•]+\.?\s*/gm, '')
        .split(/[.!?]/)
        .filter(sentence => !/[\p{Script=Han}]/u.test(sentence))
        .join('. ')
        .trim();

    return `<div class="text-container">${cleanedText
        .split(/\n\n+/)
        .map(section => {
            const lines = section
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[:]\s*/, ''));

            if (!lines.length) return '';

            return `
                <div class="section">
                    ${lines[0] ? `<h3 class="section-title">${lines[0]}</h3>` : ''}
                    ${lines.slice(1).map(line => 
                        `<div class="section-line">
                            <div class="decorator"></div>
                            <p>${line}</p>
                        </div>`
                    ).join('')}
                </div>
            `;
        })
        .join('')}</div>`;
}

const exportBtn = document.getElementById('export-btn');
const modal = document.getElementById('export-modal');
const closeModal = document.getElementById('close-modal');
const exportTxtBtn = document.getElementById('export-txt');

exportBtn.addEventListener('click', function () {
    modal.style.display = 'block';
});

closeModal.addEventListener('click', function () {
    modal.style.display = 'none';
});

exportTxtBtn.addEventListener('click', function () {
    const resultText = document.getElementById('result').innerText;
    const textInput = document.getElementById('text-input').value;
    const customInstruction = document.getElementById('custom-instruction').value;

    if (!resultText.trim()) {
        alert("Please analyze text first to export results.");
        return;
    }

    const content = `
        Analyzed Text:
        ------------------------
        ${textInput}

        Analysis Instructions:
        ------------------------
        ${customInstruction}

        ------------------------
        ${resultText}
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'emotion_analysis.txt');
    modal.style.display = 'none';
});

function saveAs(blob, fileName) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

function clearText() {
    document.getElementById('text-input').value = '';
    document.getElementById('custom-instruction').value = '';
    document.getElementById('result').innerHTML = '';
}

async function pasteText() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('text-input').value = text;
    } catch (error) {
        alert('Failed to paste text from clipboard.');
    }
}

document.getElementById('simple-analysis-btn').addEventListener('click', () => analyzeEmotions('simple'));
document.getElementById('advanced-analysis-btn').addEventListener('click', () => analyzeEmotions('advanced'));
document.getElementById('paste-btn').addEventListener('click', pasteText);
document.getElementById('clear-btn').addEventListener('click', clearText);
