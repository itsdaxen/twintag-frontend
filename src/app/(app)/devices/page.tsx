import { PageHeader } from "@/components/app/page-header";
import { DeviceLibrary } from "@/components/devices/device-library";

export default function DevicesPage() {
  return (
    <div className="p-6 pt-20 md:p-10">
      <PageHeader
        eyebrow="Recognition profiles"
        title="Device Library"
      />
      <DeviceLibrary />
    </div>
  );
}
