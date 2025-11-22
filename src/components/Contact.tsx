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
      await submitContact(formData);
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
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          📧 お問い合わせ
        </h1>
        <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
          GIIIN/ギイーンに関するご質問、ご意見、ご要望などがございましたら、お気軽にお問い合わせください。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Contact Form */}
        <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-4 sm:mb-6 amano-text-glow">
            お問い合わせフォーム
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                お名前 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="auth-input-field"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                メールアドレス <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input-field"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                お問い合わせ種別
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="auth-input-field"
              >
                <option value="general">一般的なお問い合わせ</option>
                <option value="bug">バグ報告</option>
                <option value="feature">機能要望</option>
                <option value="data">データに関するお問い合わせ</option>
                <option value="partnership">連携・協力のご相談</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                件名
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="auth-input-field"
                placeholder="お問い合わせの件名"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                メッセージ <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="auth-input-field resize-none"
                placeholder="お問い合わせ内容をご記入ください..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-button w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>送信中...</span>
                </div>
              ) : (
                "送信する"
              )}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30">
            <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
              💡 よくあるご質問
            </h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <div>
                <p className="font-medium text-cyan-400">Q. データの更新頻度は？</p>
                <p>A. 議会開催後、1-2週間程度で更新されます。</p>
              </div>
              <div>
                <p className="font-medium text-cyan-400">Q. 他の自治体も対応予定は？</p>
                <p>A. ご要望があればお聞かせください。</p>
              </div>
              <div>
                <p className="font-medium text-cyan-400">Q. データの正確性は？</p>
                <p>A. 公式議事録を基にしていますが、詳細は各議会の公式情報をご確認ください。</p>
              </div>
            </div>
          </div>

          <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30">
            <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
              🤝 連携・協力について
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              自治体、議会事務局、市民団体の皆様との連携を歓迎しています。
            </p>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• データ提供・連携</li>
              <li>• 機能改善のご提案</li>
              <li>• 他自治体への展開</li>
              <li>• 研究・調査への協力</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
