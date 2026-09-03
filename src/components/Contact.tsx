import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitContact = useMutation(api.contact.submitContactForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("必須項目を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting contact form:", formData);
      const result = await submitContact(formData);
      console.log("Contact form submission result:", result);
      toast.success("お問い合わせを送信しました。ありがとうございます。");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general"
      });
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast.error("送信に失敗しました。しばらく後でお試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="ga-page">
      <div className="ga-page-header">
        <h1>お問い合わせ</h1>
        <p style={{ maxWidth: "42ch", margin: "0 auto" }}>
          GIIIN/ギイーンに関するご質問、ご意見、ご要望などがございましたら、お気軽にお問い合わせください。
        </p>
      </div>

      <div className="ga-main">
        <div className="ga-block grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Contact Form */}
          <div className="ga-surface-card">
            <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: "var(--ga-ink)" }}>
              お問い合わせフォーム
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="ga-field">
                <label htmlFor="name">お名前 <span style={{ color: "var(--ga-gold)" }}>*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="ga-input"
                  placeholder="山田太郎"
                />
              </div>

              <div className="ga-field">
                <label htmlFor="email">メールアドレス <span style={{ color: "var(--ga-gold)" }}>*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="ga-input"
                  placeholder="example@email.com"
                />
              </div>

              <div className="ga-field">
                <label htmlFor="category">お問い合わせ種別</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="ga-select"
                >
                  <option value="general">一般的なお問い合わせ</option>
                  <option value="bug">バグ報告</option>
                  <option value="feature">機能要望</option>
                  <option value="data">データに関するお問い合わせ</option>
                  <option value="partnership">連携・協力のご相談</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div className="ga-field">
                <label htmlFor="subject">件名</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="ga-input"
                  placeholder="お問い合わせの件名"
                />
              </div>

              <div className="ga-field">
                <label htmlFor="message">メッセージ <span style={{ color: "var(--ga-gold)" }}>*</span></label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="ga-input resize-none"
                  placeholder="お問い合わせ内容をご記入ください..."
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="ga-btn ga-btn-primary w-full">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="ga-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.35)" }}></span>
                    送信中...
                  </span>
                ) : (
                  "送信する"
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="ga-surface-card">
              <h3 className="text-lg sm:text-xl font-bold mb-4" style={{ color: "var(--ga-ink)" }}>よくあるご質問</h3>
              <div className="space-y-3 text-sm" style={{ color: "var(--ga-muted)" }}>
                <div>
                  <p className="font-medium" style={{ color: "var(--ga-teal-deep)" }}>Q. データの更新頻度は？</p>
                  <p>A. 議会開催後、1-2週間程度で更新されます。</p>
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--ga-teal-deep)" }}>Q. 他の自治体も対応予定は？</p>
                  <p>A. ご要望があればお聞かせください。</p>
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--ga-teal-deep)" }}>Q. データの正確性は？</p>
                  <p>A. 公式議事録を基にしていますが、詳細は各議会の公式情報をご確認ください。</p>
                </div>
              </div>
            </div>

            <div className="ga-surface-card">
              <h3 className="text-lg sm:text-xl font-bold mb-4" style={{ color: "var(--ga-ink)" }}>連携・協力について</h3>
              <p className="text-sm mb-4" style={{ color: "var(--ga-muted)" }}>
                自治体、議会事務局、市民団体の皆様との連携を歓迎しています。
              </p>
              <ul className="text-sm space-y-2" style={{ color: "var(--ga-muted)" }}>
                <li>・データ提供・連携</li>
                <li>・機能改善のご提案</li>
                <li>・他自治体への展開</li>
                <li>・研究・調査への協力</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
