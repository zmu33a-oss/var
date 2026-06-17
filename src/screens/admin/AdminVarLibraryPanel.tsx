import { VarLibraryUploadPanel } from "../x-feed/VarLibraryUploadPanel";

type AdminVarLibraryPanelProps = {
  adminVarId: string;
};

export function AdminVarLibraryPanel(props: AdminVarLibraryPanelProps) {
  return (
    <VarLibraryUploadPanel
      managerVarId={props.adminVarId}
      compact={false}
    />
  );
}
