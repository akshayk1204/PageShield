import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Code } from "lucide-react";

export default function ScriptAnalysis({ scripts = [], suspicious = [] }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Code className="mr-2 text-indigo-600" /> Script Analysis
        </h2>
        <ul className="space-y-2">
          {scripts.map((src, i) => {
            const isSuspicious = suspicious.includes(src);
            return (
              <li
                key={i}
                className={`p-3 rounded-md border ${
                  isSuspicious ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
              >
                <div className="font-mono text-sm break-words">{src}</div>
                {isSuspicious && (
                  <div className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertTriangle className="mr-1 h-4 w-4" /> Suspicious script
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}