تمام. هذا إصدار **نظيف، مرتب، مناسب للـ GitHub، وبالإنجليزية** بدون فوضى أو نصوص عربية داخل الكود.

## Option 1: Clean Node.js check before Telegram
إذا عندك خطوة شرط قبل إرسال تيليجرام، استخدم هذا:

### `check-code.js`
function shouldTriggerTelegram(input) {
  if (typeof input !== "string") return false;
  return input.trim() === "0102";
}

const input = process.env.INPUT_CODE || "";

if (shouldTriggerTelegram(input)) {
  console.log(
    JSON.stringify({
      success: true,
      sendToTelegram: true,
      message: "Trigger accepted. Ready for the next step."
    })
  );
} else {
  console.log(
    JSON.stringify({
      success: false,
      sendToTelegram: false,
      message: "Invalid trigger code."
    })
  );
}

---

## Option 2: Clean function for workflow tools
إذا عندك workflow أو bot ويحتاج فقط شرط نظيف:

### `trigger-check.js`
const input = $json.message?.text || $json.text || "";

return {
  json: {
    passed: input.trim() === "0102",
    telegramMessage: "Trigger accepted. Ready for the next step."
  }
};

---

## Option 3: If condition only
إذا فقط تحتاج شرط:

{{$json.message?.text?.trim() === "0102"}}

أو:

{{$json.text?.trim() === "0102"}}

---

## Option 4: Telegram message payload
إذا النود التالي يحتاج رسالة نظيفة فقط:

### `telegram-payload.json`
{
  "sendToTelegram": true,
  "message": "Trigger accepted. Ready for the next step."
}

---

## GitHub-friendly project structure
إذا تبغى ترتبه داخل مشروع:

project/
├─ src/
│  ├─ check-code.js
│  └─ trigger-check.js
├─ payloads/
│  └─ telegram-payload.json
├─ package.json
└─ README.md

---

## Suggested `README.md`
# Telegram Trigger Check

This project validates a trigger code before sending a message to Telegram.

## Trigger Code
`0102`

## Files
- `src/check-code.js`: standalone Node.js validation
- `src/trigger-check.js`: workflow-compatible validation
- `payloads/telegram-payload.json`: clean Telegram payload example

## Logic
If the input value is exactly `0102`, the Telegram step can proceed.

---

## Suggested `package.json`
{
  "name": "telegram-trigger-check",
  "version": "1.0.0",
  "description": "Simple trigger validation before Telegram execution",
  "main": "src/check-code.js",
  "scripts": {
    "start": "node src/check-code.js"
  },
  "license": "MIT"
}

---

## Best clean version for GitHub
إذا تبي أفضل نسخة مختصرة وعملية، اعتمد هذا:

const input = $json.message?.text || $json.text || "";

return {
  json: {
    passed: input.trim() === "0102"
  }
};

ثم خذ الناتج `passed === true` ووصله إلى Telegram node.

إذا تريد، أقدر في الرسالة الجاية أعطيك **نسخة جاهزة 100% لمشروع GitHub كامل** بصيغة:
- `index.js`
- `package.json`
- `README.md`

أو أعطيك **نسخة n8n نظيفة جدًا** جاهزة للنسخ واللصق.