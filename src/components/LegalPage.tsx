const UPDATED = "18 November 2026";
const REPO = "https://github.com/kanokHossain/deep_os";

export function PrivacyPage() {
  return (
    <article className="card legal" aria-labelledby="privacy-title">
      <h1 id="privacy-title">Privacy Policy</h1>
      <p className="legal-meta">Last updated {UPDATED}</p>

      <p className="legal-lead">
        DeepOS is built so your thoughts stay yours. There's no account, no sign-up and no server that stores what you write.
      </p>

      <h2>What DeepOS stores, and where</h2>
      <p>
        Your tasks, parked thoughts and session history are saved only in your browser's local storage on your own device. They are
        never sent to us or to anyone else. We can't see them, read them or recover them.
      </p>
      <ul>
        <li>Clearing your browser data, or uninstalling the app, deletes everything.</li>
        <li>Data does not sync between devices. Use Analytics → Download backup to move it yourself.</li>
        <li>If you install DeepOS as an app, your browser also keeps a copy of the app's files so it works offline. This contains no personal data.</li>
      </ul>

      <h2>Anonymous usage counts</h2>
      <p>
        To learn whether DeepOS is useful, we use <b>Vercel Web Analytics</b>. It uses no cookies and doesn't identify you. It counts
        page visits (with country, device type and the page that sent you) and a few actions:
      </p>
      <ul>
        <li>a focus session started or completed, and its planned length</li>
        <li>a thought dumped (only that it happened, not what it says)</li>
        <li>a backup downloaded or restored</li>
        <li>the app installed</li>
        <li>a vote for sync across devices</li>
      </ul>
      <p>
        These counts never include anything you type: no task names, no thoughts, no history. Your vote for sync is remembered only on
        your device, so it's counted once.
      </p>

      <h2>What we don't do</h2>
      <ul>
        <li>No accounts, logins or passwords.</li>
        <li>No cookies, advertising or tracking across other websites.</li>
        <li>No collecting of what you write.</li>
        <li>No selling or sharing of data.</li>
      </ul>

      <h2>Third parties involved in loading the app</h2>
      <ul>
        <li>
          <b>Vercel</b> hosts the website. Like any web host, it receives standard request information (such as your IP address and
          browser type) to deliver the page and keep the service secure.
        </li>
        <li>
          <b>Vercel Web Analytics</b> receives the anonymous counts described above.
        </li>
        <li>
          <b>Google Fonts</b> provides the typefaces. Your browser requests the fonts from Google, which receives your IP address. After
          the first visit, an installed app uses its saved copy.
        </li>
      </ul>
      <p>None of them receives anything you type into DeepOS.</p>

      <h2>Children</h2>
      <p>DeepOS collects no personal information from anyone, including children.</p>

      <h2>Changes</h2>
      <p>If this policy changes, the new version will appear on this page with a new date.</p>

      <h2>Questions</h2>
      <p>
        Open an issue on <a href={`${REPO}/issues`}>GitHub</a>. DeepOS is open source, so you can also read the code and see exactly what it does.
      </p>
    </article>
  );
}

export function TermsPage() {
  return (
    <article className="card legal" aria-labelledby="terms-title">
      <h1 id="terms-title">Terms of Use</h1>
      <p className="legal-meta">Last updated {UPDATED}</p>

      <p className="legal-lead">DeepOS is a free, open-source focus tool. By using it you agree to these short terms.</p>

      <h2>Free to use</h2>
      <p>
        You can use DeepOS for personal or work use at no cost. The source code is available under the{" "}
        <a href={`${REPO}/blob/main/LICENSE`}>MIT License</a>, which lets you copy, change and share it.
      </p>

      <h2>A focus tool, not medical care</h2>
      <p>
        DeepOS helps you work on one task at a time and set aside distracting thoughts. It is not a medical, psychological or
        mental-health service and doesn't replace professional advice. If you're struggling or in crisis, please contact a qualified
        professional or your local emergency services.
      </p>

      <h2>Your data is your responsibility</h2>
      <p>
        Everything you write stays on your device (see the <a href="#privacy">Privacy Policy</a>). Because we never hold a copy, we can't
        restore lost data. Download a backup from Analytics if your data matters to you.
      </p>

      <h2>Use it fairly</h2>
      <p>Don't use DeepOS to break the law or to interfere with the service or other people's use of it.</p>

      <h2>No warranty</h2>
      <p>
        DeepOS is provided "as is", without warranties of any kind. It may change, have bugs, or stop being available. To the extent the law
        allows, the author isn't liable for any loss or damage arising from its use.
      </p>

      <h2>Changes</h2>
      <p>These terms may be updated. The latest version will always be on this page with its date.</p>

      <h2>Contact</h2>
      <p>
        Questions or feedback: open an issue on <a href={`${REPO}/issues`}>GitHub</a>.
      </p>
    </article>
  );
}
