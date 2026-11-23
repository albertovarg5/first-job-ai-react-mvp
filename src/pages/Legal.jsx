import { Link } from 'react-router-dom';
import { Logo } from '../components/AppLayout.jsx';

// Plain-language privacy notice and terms. Describes only what the code really does.
export default function Legal() {
  return (
    <div className="not-found legal-page">
      <Logo />
      <h1>Privacy and terms</h1>
      <p className="subtle">First Job AI is a student project. This page is a plain-language summary, not legal advice.</p>

      <h2>What we store</h2>
      <ul>
        <li><strong>Guest mode:</strong> your data stays in your own browser. We never receive it.</li>
        <li><strong>Accounts:</strong> your email, a hashed password (we cannot read it), and the resume, saved jobs and applications you create are stored in our database and are visible only to you.</li>
        <li>You can download your data or delete your account at any time in Settings.</li>
      </ul>

      <h2>Services we send data to</h2>
      <ul>
        <li><strong>Job search:</strong> your search words and location go to the JSearch API.</li>
        <li><strong>AI features (optional):</strong> text you submit goes to Anthropic only when AI is connected. Basic mode sends nothing.</li>
        <li><strong>Payments and email:</strong> Stripe handles payments (we never see card numbers); Resend sends password-reset emails.</li>
      </ul>

      <h2>Terms</h2>
      <ul>
        <li>Suggestions from the app (resume wording, cover letters, job matches) are drafts. Check them before you use them.</li>
        <li>The app never invents jobs, employers or experience for you.</li>
        <li>The service is provided as is, without any guarantee of getting a job.</li>
      </ul>

      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
