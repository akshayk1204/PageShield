import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

export default function TrackerSection({ trackers = [] }) {
  if (!trackers.length) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Eye className="mr-2 text-orange-600" /> Trackers Detected
        </h2>
        <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
          {trackers.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}