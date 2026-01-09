"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Database, Lock } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin-register"
            className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registration
          </Link>
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-teal-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600 text-lg">
            How we collect, use, and protect your information
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Privacy Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              1. Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                1.1 Personal Information
              </h3>
              <p className="text-gray-700 leading-relaxed">
                When you register for an admin account, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Email address</li>
                <li>Password (encrypted and hashed)</li>
                <li>Account creation timestamp</li>
                <li>IP address and browser information</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                1.2 Usage Information
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We automatically collect information about how you use the
                system:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Login times and session duration</li>
                <li>Actions performed within the system</li>
                <li>System performance metrics</li>
                <li>Error logs and debugging information</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              2. How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                2.1 System Administration
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Provide access to the loan management system</li>
                <li>Authenticate your identity</li>
                <li>Maintain system security</li>
                <li>Generate audit trails</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">2.2 Communication</h3>
              <p className="text-gray-700 leading-relaxed">
                We may use your email address to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Send important system notifications</li>
                <li>Notify you of security updates</li>
                <li>Provide technical support</li>
                <li>Send system maintenance alerts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              3. Information Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center mb-2">
                  <Lock className="h-5 w-5 text-teal-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    Data Encryption
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Passwords are hashed using bcrypt</li>
                  <li>Data transmission uses HTTPS</li>
                  <li>Database connections are encrypted</li>
                  <li>Sensitive data is encrypted at rest</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center mb-2">
                  <Eye className="h-5 w-5 text-teal-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    Access Control
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Role-based access permissions</li>
                  <li>Session management and timeout</li>
                  <li>IP address restrictions</li>
                  <li>Multi-factor authentication support</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center mb-2">
                <Database className="h-5 w-5 text-teal-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Data Storage</h3>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Data is stored in secure, encrypted databases</li>
                <li>Regular automated backups are performed</li>
                <li>Data retention policies are enforced</li>
                <li>Secure deletion procedures for data removal</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              4. Information Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                4.1 Third-Party Services
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal
                information to third parties, except in the following
                circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>When required by law or legal process</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With your explicit consent</li>
                <li>In case of business transfer or merger</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                4.2 Service Providers
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We may share information with trusted service providers who
                assist in system operations, provided they agree to maintain
                confidentiality and security standards.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              5. Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  data
                </li>
                <li>
                  <strong>Portability:</strong> Receive your data in a
                  structured format
                </li>
                <li>
                  <strong>Restriction:</strong> Limit how we process your data
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain processing
                  activities
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                5.1 Exercising Your Rights
              </h3>
              <p className="text-gray-700 leading-relaxed">
                To exercise any of these rights, please contact us using the
                information provided in the Contact section below.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              6. Data Retention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                6.1 Retention Periods
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Provide system access and functionality</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain audit trails for security purposes</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">6.2 Deletion</h3>
              <p className="text-gray-700 leading-relaxed">
                When your account is terminated or you request deletion, we will
                securely remove your personal information, except where
                retention is required by law.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              7. International Transfers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in
                countries other than your country of residence. We ensure
                appropriate safeguards are in place to protect your information
                during such transfers.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              8. Changes to This Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy from time to time. We will
                notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications to admin accounts</li>
                <li>Displaying notices within the system</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              9. Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this privacy policy or our data
                practices, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Data Protection Officer</strong>
                  <br />
                  Email: privacy@millenniumloans.com
                  <br />
                  Phone: +234 (0) 123 456 7890
                  <br />
                  Address: Millennium Loans Headquarters, Lagos, Nigeria
                  <br />
                  <br />
                  <strong>Response Time:</strong> We will respond to your
                  inquiry within 30 days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin-register">
            <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white">
              Back to Registration
            </Button>
          </Link>
          <Link href="/terms">
            <Button variant="outline" className="w-full sm:w-auto">
              View Terms & Conditions
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            This privacy policy is effective as of{" "}
            {new Date().toLocaleDateString()} and applies to all information
            collected by the Millennium Loans system.
          </p>
        </div>
      </div>
    </div>
  );
}
