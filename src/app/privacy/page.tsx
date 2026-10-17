import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { PRIVACY_CONTACT, telHref } from "@/config/store";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the KAFEL BARAKA mobile application and online store collects, uses, stores, and protects personal information.",
};

/*
 * The shop's published policy, word for word from the previous site's
 * privacy.html, which the mobile app also links to (/privacy.html redirects
 * here). Change the dates when the text changes.
 */
const EFFECTIVE = "July 29, 2026";
const UPDATED = "July 29, 2026";

export default function PrivacyPage() {
  return (
    <Container className={styles.page}>
      <Breadcrumbs items={[{ label: "Bosh sahifa", href: "/" }, { label: "Privacy Policy" }]} />
      <h1 className={styles.title} lang="en">
        Privacy Policy
      </h1>
      <p className={styles.updated} lang="en">
        Effective date: {EFFECTIVE} · Last updated: {UPDATED}
      </p>

      <article className={styles.card} lang="en">
        <p>
          This Privacy Policy explains how the <b>KAFEL BARAKA</b> mobile application and online store (the “App”) collects, uses, stores, and
          protects the personal information of its users. By using the App, you agree to the terms of this Policy.
        </p>

        <Section title="1. Information We Collect">
          <p>The App collects only the information necessary to provide its service:</p>
          <ul>
            <li>
              <b>Contact information:</b> the name and phone number you provide when placing an order.
            </li>
            <li>
              <b>Customer identifier:</b> the customer code issued by the store (used for login) — if you choose to enter it.
            </li>
            <li>
              <b>Order information:</b> items in your cart, order history, purchases, payments, and (if applicable) balance/debt status.
            </li>
            <li>
              <b>Technical information:</b> basic technical data required for the stable operation of the App (for example, request time).
            </li>
          </ul>
          <p className={styles.note}>
            <b>What We Do Not Collect.</b> The App does not collect or store your location (GPS), contacts, camera, or payment card details.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>The collected information is used for the following purposes:</p>
          <ul>
            <li>To receive, process, and deliver your orders;</li>
            <li>To contact you regarding your order (by phone);</li>
            <li>To display your purchase, order, and payment history when you log in as a customer;</li>
            <li>To improve service quality and fix technical issues.</li>
          </ul>
          <p>We do not sell your information for advertising and do not share it with third parties for commercial purposes.</p>
        </Section>

        <Section title="3. Data Storage and Security">
          <p>
            Your data is stored on secured servers, and encrypted (HTTPS) connections are used during transmission. We apply reasonable technical
            and organizational measures to prevent unauthorized access, alteration, or disclosure.
          </p>
        </Section>

        <Section title="4. Sharing With Third Parties">
          <p>Your information may be shared only in the following cases and only to the extent necessary:</p>
          <ul>
            <li>With service providers directly involved in delivering your order;</li>
            <li>When required by law or in response to a lawful request from authorized government authorities.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            Your personal information is retained for as long as necessary to provide the service or as required by law. Upon your request, your
            account and related data may be deleted.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <ul>
            <li>Request access to and correction of your information;</li>
            <li>Request deletion of your account and personal data;</li>
            <li>Withdraw the consent you gave for the use of your data.</li>
          </ul>
          <p>To exercise these rights, please contact us using the details below.</p>
        </Section>

        <Section title="7. Children’s Privacy">
          <p>
            The App is not intended for children under the age of 13, and we do not knowingly collect personal information from children. If we
            become aware that such information has been collected, we will delete it.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            This Privacy Policy may be updated from time to time. Any changes will be posted on this page, and the “Last updated” date will be
            revised. We will make reasonable efforts to notify you of significant changes through the App.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p>If you have any questions or requests regarding this Privacy Policy:</p>
          <ul>
            <li>Store: KAFEL BARAKA</li>
            {PRIVACY_CONTACT.email && (
              <li>
                Email: <a href={`mailto:${PRIVACY_CONTACT.email}`}>{PRIVACY_CONTACT.email}</a>
              </li>
            )}
            {PRIVACY_CONTACT.phone && (
              <li>
                Phone: <a href={telHref(PRIVACY_CONTACT.phone)}>{PRIVACY_CONTACT.phone}</a>
              </li>
            )}
            <li>Address: Uzbekistan</li>
          </ul>
        </Section>
      </article>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
