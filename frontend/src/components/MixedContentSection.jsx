import { Card, CardContent } from "@/components/ui/card";
import { AlertOctagon } from "lucide-react";

export default function MixedContentSection({ warnings = [] }) {
  if (!warnings.length) return null;

  return (
    <Card className="border-red-300">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-red-700">
          <AlertOctagon className="mr-2" /> Mixed Content Warnings
        </h2>
        <ul className="list-disc ml-5 space-y-1 text-sm text-red-800">
          {warnings.map((warn, i) => <li key={i}>{warn}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}