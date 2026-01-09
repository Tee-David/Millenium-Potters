"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, BarChart3, Settings } from "lucide-react";
import Link from "next/link";

export default function TermsAndConditionsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">
              Terms and Conditions
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Admin Account Registration and System Usage Agreement
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Terms Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              1. Admin Account Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                1.1 Single Admin Policy
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Only one administrative account may be created per system
                installation. This ensures centralized control and prevents
                unauthorized administrative access. Once an admin account is
                created, no additional admin accounts can be registered through
                this interface.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                1.2 Account Security
              </h3>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for maintaining the security of your admin
                account credentials. This includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Using a strong, unique password</li>
                <li>
                  Not sharing your credentials with unauthorized personnel
                </li>
                <li>Regularly updating your password</li>
                <li>Immediately reporting any suspected security breaches</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                1.3 Account Information
              </h3>
              <p className="text-gray-700 leading-relaxed">
                You must provide accurate and complete information during
                registration. Any changes to your account information must be
                updated promptly through the system settings.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              2. System Administration Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-teal-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    User Management
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Create and manage branch manager accounts</li>
                  <li>Assign credit officers to branches</li>
                  <li>Monitor user activity and permissions</li>
                  <li>Deactivate compromised accounts</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center mb-2">
                  <BarChart3 className="h-5 w-5 text-teal-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    System Monitoring
                  </h3>
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Monitor loan performance metrics</li>
                  <li>Review audit logs regularly</li>
                  <li>Track system usage and performance</li>
                  <li>Generate compliance reports</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center mb-2">
                <Settings className="h-5 w-5 text-teal-600 mr-2" />
                <h3 className="font-semibold text-gray-800">
                  System Configuration
                </h3>
              </div>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Configure loan types and terms</li>
                <li>Set interest rates and fees</li>
                <li>Manage branch configurations</li>
                <li>Update system settings as needed</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              3. Data Protection and Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                3.1 Customer Data Protection
              </h3>
              <p className="text-gray-700 leading-relaxed">
                As an administrator, you have access to sensitive customer
                information. You must:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Protect customer data from unauthorized access</li>
                <li>Comply with applicable data protection regulations</li>
                <li>
                  Ensure data is used only for legitimate business purposes
                </li>
                <li>Implement appropriate security measures</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">3.2 Audit Trail</h3>
              <p className="text-gray-700 leading-relaxed">
                All administrative actions are logged and monitored. You are
                responsible for ensuring that all actions taken through your
                account are legitimate and authorized.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                3.3 Privacy Policy
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Your use of the system is also governed by our Privacy Policy,
                which explains how we collect, use, and protect your
                information. Please review our Privacy Policy for complete
                details about our data practices.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              4. Compliance and Legal Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                4.1 Regulatory Compliance
              </h3>
              <p className="text-gray-700 leading-relaxed">
                You must ensure that all loan operations comply with applicable
                financial regulations, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Interest rate regulations</li>
                <li>Consumer protection laws</li>
                <li>Anti-money laundering requirements</li>
                <li>Know Your Customer (KYC) procedures</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                4.2 Reporting Requirements
              </h3>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for ensuring timely and accurate reporting
                to regulatory authorities as required by law.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              5. System Availability and Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                5.1 System Maintenance
              </h3>
              <p className="text-gray-700 leading-relaxed">
                The system may undergo scheduled maintenance periods. You will
                be notified of any planned maintenance that may affect system
                availability.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                5.2 Backup and Recovery
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Regular backups are maintained, but you should ensure that
                critical business operations have appropriate contingency plans
                in place.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              6. Prohibited Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Attempting to create multiple admin accounts</li>
                <li>Sharing admin credentials with unauthorized personnel</li>
                <li>
                  Accessing or modifying data outside of legitimate business
                  purposes
                </li>
                <li>Attempting to circumvent system security measures</li>
                <li>
                  Using the system for any illegal or unauthorized activities
                </li>
                <li>
                  Interfering with system operations or other users' access
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              7. Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                The system is provided "as is" without warranties of any kind.
                You acknowledge that you are using the system at your own risk
                and that the system provider shall not be liable for any damages
                arising from the use of the system.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              8. Termination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                8.1 Account Termination
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Your admin account may be terminated if you violate these terms
                and conditions or engage in prohibited activities. Upon
                termination, your access to the system will be immediately
                revoked.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                8.2 Data Retention
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Upon account termination, your personal data will be handled
                according to applicable data protection regulations and our
                privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              9. Changes to Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                These terms and conditions may be updated from time to time. You
                will be notified of any material changes, and continued use of
                the system constitutes acceptance of the updated terms.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              10. Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these terms and conditions or
                need assistance with your admin account, please contact:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>System Administrator</strong>
                  <br />
                  Email: admin@millenniumloans.com
                  <br />
                  Phone: +234 (0) 123 456 7890
                  <br />
                  Address: Millennium Loans Headquarters, Lagos, Nigeria
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin-register">
            <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white">
              I Agree - Continue Registration
            </Button>
          </Link>
          <Link href="/privacy">
            <Button variant="outline" className="w-full sm:w-auto">
              View Privacy Policy
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            By proceeding with admin account registration, you acknowledge that
            you have read, understood, and agree to be bound by these terms and
            conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
