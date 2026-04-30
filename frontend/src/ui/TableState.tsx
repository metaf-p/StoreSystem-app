export function TableState({
  children,
  empty,
  emptyMessage,
  error,
  loading,
  colSpan,
}: {
  children: React.ReactNode;
  empty: boolean;
  emptyMessage: string;
  error?: string;
  loading: boolean;
  colSpan: number;
}) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="py-10 text-center">
            <div className="inline-flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" role="status" />
              Загрузка...
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (error) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="py-10 text-center text-sm text-destructive">
            {error}
          </td>
        </tr>
      </tbody>
    );
  }

  if (empty) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return <tbody>{children}</tbody>;
}
