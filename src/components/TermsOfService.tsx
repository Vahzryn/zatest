import React from 'react';

export function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-8 tracking-tight">Terms of Service</h1>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-[#bdc1c6] leading-relaxed">
        <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <p>
          Welcome to Zapixal. By accessing or using our website and services, you agree to comply with and be bound by these Terms of Service.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">1. Description of Service</h2>
        <p>
          Zapixal provides an online, browser-based image conversion and compression utility. The service processes all images locally within your web browser using WebAssembly. We do not host, store, or transmit your images to external servers.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">2. Use of the Service</h2>
        <p>
          Zapixal is provided as a free utility service. You may use the service for personal and commercial projects. You agree not to use the service for any illegal or unauthorized purpose.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">3. "As-Is" Provision and Server Liability</h2>
        <p>
          The service is provided on an <strong>"AS IS" and "AS AVAILABLE" basis</strong>, without any warranties of any kind, either express or implied. Because Zapixal processes all data locally on your device, we assume no server liability for data loss, file corruption, or interruptions. You are solely responsible for ensuring you have backups of your original files before processing them.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">4. Intellectual Property</h2>
        <p>
          You retain all ownership rights to the images you process using Zapixal. We claim no intellectual property rights over the files you convert or compress. Zapixal is proprietary software. All rights to the source code, branding, logo, and design identity are reserved.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">5. Limitation of Liability</h2>
        <p>
          In no event shall Zapixal, its creators, or contributors be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service, including but not limited to damages for loss of profits, data, or other intangible losses.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">6. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. Your continued use of the service after any such changes constitutes your acceptance of the new Terms of Service.
        </p>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8">7. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at <strong>vahzryn@zapixal.com</strong>.
        </p>
      </div>
    </div>
  );
}
