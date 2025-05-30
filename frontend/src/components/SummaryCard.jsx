import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";

export default function SummaryCard({ url }) {
  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-2">Scan Summary</h2>
        <p className="text-lg">URL: <span className="font-mono">{url}</span></p>
        <div className="flex items-center mt-4 text-green-100">
          <BadgeCheck className="mr-2" />
          Scan completed successfully.
        </div>
      </CardContent>
    </Card>
  );
}