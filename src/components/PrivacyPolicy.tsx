import React from 'react';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-8 tracking-tight">Privacy Policy</h1>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-[#bdc1c6] leading-relaxed">
        <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
          Last Updated: August 14, 2026
        </p>

        <section className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 mt-0">How We Handle Your Data</h2>
          <p className="mb-2">
            Zapixal divides data handling into two separate categories: normal image processing, and optional feedback submissions.
          </p>
          <p className="mb-0">
            For normal image processing, all operations are kept locally on your device. For optional feedback, specific information you provide is transmitted to our servers.
          </p>
        </section>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">1. Normal Image Processing (Local)</h2>
        <p>
          When you use Zapixal to convert, compress, or edit images under standard operations:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Local Browser Processing:</strong> All image processing, conversion, resizing, and metadata stripping occur locally inside your browser memory. We use WebAssembly and the HTML5 Canvas API to perform these conversions on your device.</li>
          <li><strong>No Image Uploads:</strong> Your raw image files are not uploaded, transmitted, logged, or stored on external servers for conversions.</li>
          <li><strong>No Account Requirements:</strong> You do not need to create an account, register, or provide an email address to use our image processing features.</li>
        </ul>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">2. Optional Feedback Submissions (Transmitted)</h2>
        <p>
          Zapixal includes an optional feedback tool. If you choose to submit feedback or report an issue, specific information is transmitted over the network to our feedback service:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Feedback Message:</strong> The written text you enter in the form to describe your request or issue.</li>
          <li><strong>Optional Screenshot:</strong> An optional screenshot of the application view (rendered locally first) that you can choose to include with your submission.</li>
          <li><strong>Diagnostic & Browser Information:</strong> Basic browser metadata, including user-agent, operating system, screen size, active tool route, and preferred language.</li>
          <li><strong>Error Information:</strong> Diagnostic console logs or processing error details to help us troubleshoot issues.</li>
        </ul>
        <p>
          This data transmission is entirely voluntary and only occurs when you explicitly click the "Submit" or "Send Feedback" button.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">3. Cloudflare Web Analytics and Performance Monitoring (RUM)</h2>
        <p>
          Zapixal leverages Cloudflare Web Analytics / Real User Monitoring (RUM) to monitor site availability, performance, and general platform health.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Performance Telemetry:</strong> Cloudflare Web Analytics may collect technical metrics such as page load times, browser versions, operating systems, and connection-level latency measurements.</li>
          <li><strong>Pipeline Isolation:</strong> This telemetry collection is completely separate from the image-processing pipeline. It does not access, scan, or transmit your raw image files or processed results.</li>
          <li><strong>Data Scope:</strong> Cloudflare collects basic connection-level telemetry and usage patterns. No image files or user-authored contents are sent over the network merely because analytics are enabled.</li>
        </ul>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">4. Preferences and Local Storage</h2>
        <p>
          We use your browser's local storage (localStorage) on your own device to save your configuration preferences, such as your theme choice (Light or Dark mode) and your default target format selections. This information is stored locally and is not shared with our servers.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">5. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy occasionally. Any updates will maintain the core principle that normal image files are processed locally on your device and are not uploaded to our servers for conversion.
        </p>
        
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">6. Contact Us</h2>
        <p>
          If you have questions about our privacy policy or how we handle your information, please contact us at <strong>vahzryn@zapixal.com</strong>.
        </p>
      </div>
    </div>
  );
}
