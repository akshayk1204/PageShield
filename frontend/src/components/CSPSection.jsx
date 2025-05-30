import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function CSPSection({ existingCSP, suggestedCSP }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <ShieldCheck className="mr-2 text-blue-600" /> Content Security Policy (CSP)
        </h2>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600">Current Policy:</h3>
          <pre className="bg-gray-100 p-3 rounded text-xs text-gray-800 overflow-auto">
            {existingCSP === 'Not set' ? 'No CSP header found.' : existingCSP}
          </pre>
        </div>
        {suggestedCSP && (
          <div>
            <h3 className="text-sm font-medium text-gray-600">Suggested Policy:</h3>
            <pre className="bg-green-100 p-3 rounded text-xs text-green-800 overflow-auto">
              {suggestedCSP}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
