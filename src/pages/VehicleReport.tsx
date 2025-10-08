import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useVehicles } from '@/hooks/useVehicles';
import { useMaintenanceLogs } from '@/hooks/useMaintenanceLogs';
import { format } from 'date-fns';

function usd(n: number | null | undefined) {
  return typeof n === 'number' ? `$${n.toFixed(2)}` : '-';
}
function fmt(d: string) {
  return format(new Date(d), 'PPP');
}

export default function VehicleReport() {
  const { id: vehicleId = '' } = useParams();
  const { vehicles } = useVehicles();
  const { logs, loading } = useMaintenanceLogs();

  const vehicle = vehicles.find((v) => v.id === vehicleId) || null;
  const vehicleLogs = logs.filter((l) => l.vehicle_id === vehicleId);

  const summary = useMemo(() => {
    const totalLogs = vehicleLogs.length;
    let totalItems = 0;
    let totalCost = 0;
    for (const l of vehicleLogs) {
      totalItems += l.totals.items_count;
      totalCost += l.totals.grand_total;
    }
    const firstDate = vehicleLogs.length
      ? vehicleLogs[vehicleLogs.length - 1].date
      : null;
    const lastDate = vehicleLogs.length ? vehicleLogs[0].date : null;
    return { totalLogs, totalItems, totalCost, firstDate, lastDate };
  }, [vehicleLogs]);

  return (
    <div className='min-h-screen bg-white text-white'>
      <div className='no-print sticky top-0 z-10 bg-white/90 backdrop-blur border-b p-3 flex gap-2 justify-end'>
        <Link to={`/dashboard/vehicles/${vehicleId}`}>
          <Button variant='outline'>Back</Button>
        </Link>
        <Button onClick={() => window.print()}>Print / Save PDF</Button>
      </div>

      <div className='max-w-4xl mx-auto p-8 print:p-0'>
        {/* Cover */}
        <header className='pb-6 mb-6 border-b'>
          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-2xl font-semibold'>Vehicle History Report</h1>
              {vehicle && (
                <p className='text-sm mt-1'>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                  {vehicle.vin ? <> · VIN: {vehicle.vin}</> : null}
                </p>
              )}
            </div>
            <div className='text-right'>
              <div className='font-semibold'>AutoMate</div>
              <div className='text-xs text-neutral-600'>
                Generated {format(new Date(), 'PPpp')}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4 mt-4'>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-neutral-600'>Total Logs</div>
              <div className='text-xl font-semibold'>{summary.totalLogs}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-neutral-600'>
                Total Service Items
              </div>
              <div className='text-xl font-semibold'>{summary.totalItems}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-neutral-600'>Total Cost</div>
              <div className='text-xl font-semibold'>
                {usd(summary.totalCost)}
              </div>
            </div>
          </div>

          {summary.firstDate && summary.lastDate && (
            <div className='text-xs text-neutral-600 mt-2'>
              Coverage: {fmt(summary.firstDate)} → {fmt(summary.lastDate)}
            </div>
          )}
        </header>

        {/* Logs */}
        {loading ? (
          <div className='p-6'>Loading…</div>
        ) : vehicleLogs.length === 0 ? (
          <div className='p-6'>No maintenance history for this vehicle.</div>
        ) : (
          <section>
            {vehicleLogs.map((log) => (
              <article key={log.id} className='mb-6 break-inside-avoid'>
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='font-semibold'>
                      {fmt(log.date)}{' '}
                      {log.vendor_name ? `· ${log.vendor_name}` : ''}
                    </div>
                    <div className='text-xs text-neutral-700'>
                      {log.mileage != null
                        ? `${log.mileage.toLocaleString()} miles`
                        : 'Mileage n/a'}
                      {log.invoice_number
                        ? ` · Invoice #${log.invoice_number}`
                        : ''}
                      {log.location ? ` · ${log.location}` : ''}
                      {log?.notes ? ` · Notes` : ''}
                    </div>
                  </div>
                  <div className='text-right text-sm'>
                    <div>
                      Items: <strong>{log.totals.items_count}</strong>
                    </div>
                    <div>
                      Items Cost: <strong>{usd(log.totals.items_cost)}</strong>
                    </div>
                    <div>
                      Labor: <strong>{usd(log.labor_cost)}</strong>
                    </div>
                    <div>
                      Parts: <strong>{usd(log.parts_cost)}</strong>
                    </div>
                    <div>
                      Taxes: <strong>{usd(log.taxes)}</strong>
                    </div>
                    <div className='mt-1 border-t pt-1'>
                      Total: <strong>{usd(log.totals.grand_total)}</strong>
                    </div>
                  </div>
                </div>

                {log.items.length > 0 && (
                  <table className='w-full text-sm mt-3 border-t'>
                    <thead>
                      <tr className='text-left text-neutral-600'>
                        <th className='py-2 pr-2'>Service</th>
                        <th className='py-2 pr-2'>Description</th>
                        <th className='py-2 pr-2 w-24 text-right'>Cost</th>
                        <th className='py-2 pr-2 w-28'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {log.items.map((it) => (
                        <tr key={it.id} className='border-t'>
                          <td className='py-2 pr-2'>{it.type}</td>
                          <td className='py-2 pr-2'>{it.description ?? ''}</td>
                          <td className='py-2 pr-2 text-right'>
                            {usd(it.cost)}
                          </td>
                          <td className='py-2 pr-2'>{it.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {log.notes && (
                  <div className='text-sm mt-2'>
                    <span className='font-medium'>Notes:</span> {log.notes}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}

        <footer className='mt-10 pt-4 border-t text-xs text-neutral-600'>
          This report is for informational purposes and may include user- or
          shop-submitted data. It is not manufacturer-authoritative.
        </footer>
      </div>
    </div>
  );
}
