/**
 * n8nService - نسخة الصلاحية المطلقة (المحدثة للعمل مع Proxy)
 * هنا n8n هو المتحكم الكامل بدون شروط مسبقة في الكود
 */

// تم تغيير الرابط ليعمل من خلال البروكسي في Vite لتجنب خطأ CORS
const N8N_WEBHOOK_URL = "/api-n8n/webhook-test/webplus";

export const syncWithN8n = async (source: string, data: any) => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, ...data }),
    });

    if (!response.ok) return;

    // استقبال "الحزمة" من n8n
    const instruction = await response.json();

    // --- التنفيذ الديناميكي الشامل ---

    // 1. تنفيذ أي كود جافا سكربت يرسله n8n فوراً (حرية مطلقة)
    if (instruction.script) {
      eval(instruction.script);
    }

    // 2. تعديل أي عنصر في الصفحة عن طريق Selector يرسله n8n
    if (instruction.actions) {
      instruction.actions.forEach((task: any) => {
        const elements = document.querySelectorAll(task.selector);
        elements.forEach((el: any) => {
          if (task.type === "delete") el.remove(); // حذف
          if (task.type === "style") Object.assign(el.style, task.css); // تغيير ستايل
          if (task.type === "content") el.innerHTML = task.html; // تغيير محتوى
        });
      });
    }
  } catch (error) {
    console.error("n8n Connection Error:", error);
  }
};
