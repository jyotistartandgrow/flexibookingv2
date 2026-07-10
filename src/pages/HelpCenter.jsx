import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Clock3,
  CreditCard,
  Bell,
  CalendarDays,
  ClipboardList,
  LifeBuoy,
  MessageCircle,
  PhoneCall,
  Settings,
  UserCog,
  Ticket,
  X,
} from "lucide-react";

const quickActions = [
  {
    title: "Instant Feedback",
    description: "Collect real-time user responses and ratings.",
    tag: "Help",
    Icon: MessageCircle,
  },
  {
    title: "View Bookings",
    description: "Track appointments and manage booking flow.",
    tag: "Guide",
    Icon: CalendarDays,
  },
  {
    title: "Onboarding",
    description: "Follow setup checklist and complete basics.",
    tag: "New",
    Icon: ClipboardList,
  },
  {
    title: "Notifications",
    description: "Configure and monitor delivery status.",
    tag: "Popular",
    Icon: Bell,
  },
  {
    title: "Policy Settings",
    description: "Set rules for booking and cancellation.",
    tag: "Guide",
    Icon: Settings,
  },
  {
    title: "WhatsApp Setup",
    description: "Connect WhatsApp and automate updates.",
    tag: "Trending",
    Icon: Clock3,
  },
];

const helpTags = [
  { label: "Getting started", tone: "blue" },
  { label: "Feedback", tone: "pink" },
  { label: "Bookings", tone: "green" },
  { label: "Onboarding", tone: "amber" },
  { label: "Dashboard", tone: "cyan" },
  { label: "Analytics", tone: "violet" },
  { label: "Settings", tone: "slate" },
  { label: "User management", tone: "teal" },
  { label: "Notifications", tone: "gold" },
  { label: "Profile", tone: "purple" },
];

const faqGroups = [
  {
    title: "Getting Started",
    tone: "blue",
    count: "Popular",
    Icon: BookOpen,
    entries: [
      "What is FlexiBooking?",
      "How do I set up my workspace after registering?",
      "What roles can be assigned?",
    ],
  },
  {
    title: "Feedback",
    tone: "violet",
    count: "Popular",
    Icon: MessageCircle,
    entries: [
      "How do feedback forms function?",
      "How are feedback scores calculated?",
      "Can users comment on a rating via feedback?",
      "Can I filter feedback by branch or staff?",
    ],
  },
  {
    title: "Bookings",
    tone: "mint",
    count: "Popular",
    Icon: CalendarDays,
    entries: [
      "What is the booking engine?",
      "How do I pause or close for different slots?",
      "Can I create recurring slots?",
      "How do slots reset for next day?",
      "How can admin view booking in calendar?",
    ],
  },
  {
    title: "Onboarding",
    tone: "amber",
    count: "New",
    Icon: ClipboardList,
    entries: [
      "What is the onboarding journey (owner / admin)?",
      "Can I reset or delete onboarding steps?",
      "What is the checklist right now?",
      "Can users skip the onboarding while signup?",
    ],
  },
  {
    title: "Dashboard",
    tone: "cyan",
    count: "Popular",
    Icon: Clock3,
    entries: [
      "Who can access the dashboard?",
      "What metrics does the dashboard show?",
      "What is the Revenue Activity feed?",
    ],
  },
  {
    title: "Analytics (Admin)",
    tone: "rose",
    count: "New",
    Icon: CreditCard,
    entries: ["What does the Analytics page show?", "Who can access analytics?"],
  },
  {
    title: "Settings (Admin)",
    tone: "slate",
    count: "Popular",
    Icon: Settings,
    entries: [
      "How do I create a new feedback form?",
      "How do I add a branch or location?",
      "How can I configure booking restrictions?",
      "Can I control which actions are public?",
    ],
  },
  {
    title: "User Management (Admin)",
    tone: "teal",
    count: "FAQ",
    Icon: UserCog,
    entries: [
      "How do I invite new users to my workspace?",
      "How do I change user roles?",
      "How can I deactivate users temporarily?",
    ],
  },
  {
    title: "Notifications",
    tone: "gold",
    count: "Popular",
    Icon: Bell,
    entries: [
      "What triggers notifications?",
      "How do I track a notification status?",
      "How do I create a notification?",
      "Who can view notification history?",
    ],
  },
  {
    title: "Profile & Account",
    tone: "purple",
    count: "Help",
    Icon: UserCog,
    entries: [
      "How do I update my name, phone, or avatar?",
      "How do I change my password?",
      "Can changes sync with calendar?",
      "Where can I manage my notification settings?",
    ],
  },
];

export default function HelpCenter() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    setIsSent(true);
  };

  const closeEmailForm = () => {
    setShowEmailForm(false);
    setIsSent(false);
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="hc-page">
      <main className="hc-main">
        <div className="hc-section-head">Quick Links</div>
        <section className="hc-quick-actions">
          {quickActions.map(({ title, description, tag, Icon }) => (
            <article key={title} className="hc-action-card">
              <div className="hc-action-icon">
                <Icon size={16} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span>{tag}</span>
            </article>
          ))}
        </section>

        <div className="hc-category-row">
          {helpTags.map((tag) => (
            <button
              key={tag.label}
              type="button"
              className={`hc-chip ${tag.tone}`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <section className="hc-faq-stack">
          {faqGroups.map((group) => (
            <article key={group.title} className={`hc-faq-card ${group.tone}`}>
              <div className="hc-faq-title">
                <group.Icon size={14} />
                <h2>{group.title}</h2>
                <span className="hc-faq-badge">{group.count}</span>
              </div>

              {group.entries.map((question) => (
                <details key={question} className="hc-faq-item">
                  <summary>
                    <span>{question}</span>
                    <ChevronDown size={16} className="hc-chevron" />
                  </summary>
                </details>
              ))}
            </article>
          ))}
        </section>

        <section className="hc-contact-card">
          <div>
            <h3>Still need help?</h3>
            <p>
              Can&apos;t find your answer? Our support team is ready to help via
              email and live support.
            </p>
          </div>
          <div className="hc-contact-actions">
            <button type="button" className="hc-contact-btn secondary">
              <Ticket size={16} />
              Open Ticket
            </button>
            <button
              type="button"
              className="hc-contact-btn primary"
              onClick={() => setShowEmailForm(true)}
            >
              <LifeBuoy size={16} />
              Email Support
            </button>
          </div>
        </section>

        <button type="button" className="hc-help-float" aria-label="Open support chat">
          <PhoneCall size={14} />
        </button>

        {showEmailForm && (
          <div className="hc-modal-backdrop" role="dialog" aria-modal="true">
            <div className="hc-email-modal">
              <button
                type="button"
                className="hc-modal-close"
                onClick={closeEmailForm}
                aria-label="Close email form"
              >
                <X size={16} />
              </button>

              {!isSent ? (
                <>
                  <h3>Email Support</h3>
                  <p>Share your issue details and our team will get back to you.</p>

                  <form className="hc-email-form" onSubmit={handleEmailSubmit}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    <input
                      type="text"
                      name="subject"
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    />
                    <textarea
                      name="message"
                      placeholder="Write your message..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      required
                    />
                    <button type="submit">Send Email</button>
                  </form>
                </>
              ) : (
                <div className="hc-email-success">
                  <h3>Email sent</h3>
                  <p>Thanks! Our support team will reply shortly.</p>
                  <button type="button" onClick={closeEmailForm}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
