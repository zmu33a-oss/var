import { PageHeader } from "../components/PageHeader";

type PredictionsPageProps = {
  onToast: (message: string) => void;
};

const MOCK_PREDICTIONS = [
  {
    id: "pred1",
    title: "نهائي الدوري",
    detail: "فوز الفريق أ · 120 نقطة · مقفل",
  },
  {
    id: "pred2",
    title: "دوري الأبطال",
    detail: "تعادل · 80 نقطة · مقفل",
  },
];

export function PredictionsPage(_props: PredictionsPageProps) {
  return (
    <>
      <PageHeader
        eyebrow="PREDICTIONS"
        title="التوقعات والنقاط"
        description="مراجعة التوقعات المقفلة وتعديل النقاط يدوياً — واجهة معاينة."
        phaseLabel="قريباً"
      />

      <section className="section-card">
        <div className="section-head">
          <h2 className="section-title">توقعات مقفلة</h2>
          <span className="section-tag">LOCKED</span>
        </div>

        {MOCK_PREDICTIONS.map((item) => (
          <div key={item.id} className="list-row">
            <div className="row-copy">
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
            <button
              type="button"
              className="btn-action warn"
              disabled
              title="قريباً"
            >
              تعديل نقاط
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
