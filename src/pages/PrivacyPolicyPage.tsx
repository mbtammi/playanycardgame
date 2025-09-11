import React from 'react';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-policy-container">
        <header className="privacy-policy-header">
          <h1 className="privacy-policy-title">Privacy Policy</h1>
          <p className="privacy-policy-subtitle">
            Last updated: January 1, 2025
          </p>
        </header>

        <div className="privacy-policy-content">
          <section className="policy-section">
            <h2>Introduction</h2>
            <p>
              Welcome to Play Any Card Game. We respect your privacy and are committed to protecting 
              your personal data. This privacy policy explains how we collect, use, and safeguard 
              your information when you use our AI-powered card game creation platform.
            </p>
          </section>

          <section className="policy-section">
            <h2>Information We Collect</h2>
            <h3>Information You Provide</h3>
            <ul>
              <li>Game descriptions and rules you input</li>
              <li>Email addresses (for feature requests or support)</li>
              <li>Feedback and feature requests</li>
            </ul>
            
            <h3>Automatically Collected Information</h3>
            <ul>
              <li>Usage data and analytics</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address (anonymized)</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To provide and improve our card game creation service</li>
              <li>To process your game creation requests through our AI system</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To respond to your inquiries and feature requests</li>
              <li>To ensure the security and integrity of our platform</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>AI and Data Processing</h2>
            <p>
              When you create a card game, your game descriptions are processed by our AI system 
              (powered by OpenAI's services). This data is used solely to generate your custom 
              card game and is not stored permanently or used for training AI models.
            </p>
          </section>

          <section className="policy-section">
            <h2>Data Sharing and Third Parties</h2>
            <p>We do not sell, trade, or rent your personal information. We may share data with:</p>
            <ul>
              <li><strong>Service Providers:</strong> OpenAI for AI processing, analytics services</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your data against unauthorized 
              access, alteration, disclosure, or destruction. However, no internet transmission 
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="policy-section">
            <h2>Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience. These help us:
            </p>
            <ul>
              <li>Remember your preferences</li>
              <li>Analyze site usage</li>
              <li>Provide personalized content</li>
            </ul>
            <p>You can control cookie settings through your browser preferences.</p>
          </section>

          <section className="policy-section">
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
            </ul>
            <p>To exercise these rights, contact us at mirotammi44@gmail.com</p>
          </section>

          <section className="policy-section">
            <h2>Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect 
              personal information from children under 13. If we become aware of such collection, 
              we will delete the information immediately.
            </p>
          </section>

          <section className="policy-section">
            <h2>International Data Transfers</h2>
            <p>
              Your data may be processed in countries other than your own. We ensure appropriate 
              safeguards are in place to protect your data in accordance with applicable laws.
            </p>
          </section>

          <section className="policy-section">
            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any 
              changes by posting the new policy on this page with an updated "Last updated" date.
            </p>
          </section>

          <section className="policy-section">
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our data practices, 
              please contact us at:
            </p>
            <div className="contact-info">
              <p>Email: mirotammi44@gmail.com</p>
              <p>Website: <a href="https://mteif.com" target="_blank" rel="noopener noreferrer">mteif.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
