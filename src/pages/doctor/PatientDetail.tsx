import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useParams } from "react-router-dom";

export default function PatientDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Detail"
        subtitle={`Patient ID: ${id ?? "demo"}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Patient Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>Name: <strong>Akhilesh Kumar</strong></div>
          <div>Age: 42</div>
          <div>
            Status: <Badge variant="green">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button>View Reports</Button>
          <Button variant="secondary">Appointments</Button>
        </CardContent>
      </Card>
    </div>
  );
}
