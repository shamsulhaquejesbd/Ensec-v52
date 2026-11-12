import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  Edit2,
  Check,
  Building,
  Calendar,
  Truck,
  Hash,
  Download,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  FileText,
} from 'lucide-react';
import { SalesOrder, Customer } from '../../types/erp.ts';
import { useERP } from '../../context/ERPContext.tsx';

interface DeliveryOrderModalProps {
  order: SalesOrder;
  onClose: () => void;
  onUpdateOrder?: (orderId: string, updates: Partial<SalesOrder>) => void;
  onSwitchToChallan?: () => void;
  onAcceptDO?: (orderId: string, acceptanceDetails: { acceptedBy: string; notes?: string }) => void;
  onOpenSerialsAndChallan?: (order: SalesOrder) => void;
}

export const DeliveryOrderModal: React.FC<DeliveryOrderModalProps> = ({
  order,
  onClose,
  onUpdateOrder,
  onSwitchToChallan,
  onAcceptDO,
  onOpenSerialsAndChallan,
}) => {
  const { customers, distributors } = useERP();
  const [showAcceptPrompt, setShowAcceptPrompt] = useState(false);
  const [acceptingPerson, setAcceptingPerson] = useState('Engr. Abu Jubair Khan (Factory / Production In-Charge)');
  const [acceptanceNotes, setAcceptanceNotes] = useState('D.O. reviewed and accepted for factory dispatch & serial allocation.');
  const isAccepted = Boolean(order.doAccepted || order.status === 'DO Accepted' || order.status === 'Challan Generated' || order.status === 'Dispatched & Invoiced' || order.status === 'Delivered' || order.status === 'Invoiced');

  // Find associated customer/buyer for full address and contact info
  const buyerDetails = useMemo(() => {
    const cust = customers.find((c) => c.id === order.customerId || c.name === order.customerName);
    const dist = distributors.find((d) => d.id === order.distributorId || d.name === order.distributorName);

    const name = order.customerName || cust?.name || dist?.name || 'Integrated Development Foundation (IDF)';
    const contactName = cust?.ownerName || cust?.contactPerson || order.customerName?.split(' ')[0] || 'Uzzal Hossain';
    const address = cust?.address || cust?.district || 'Tongi, Gazipur';
    const mobile = cust?.phone || cust?.mobile || '+8801327-113571';
    const bin = cust?.bin || cust?.taxId || (order as any).buyerBin || '002391029-0101';

    return {
      name,
      contactName,
      address,
      mobile,
      bin,
    };
  }, [customers, distributors, order]);

  // Format Date as DD.MM.YYYY
  const formattedDate = useMemo(() => {
    try {
      const d = order.date ? new Date(order.date) : new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return '27.10.2026';
    }
  }, [order.date]);

  // D/O Number
  const doNumber = useMemo(() => {
    if (order.doNumber) return order.doNumber;
    const cleanNum = (order.orderNumber || order.id || '88').replace(/\D/g, '').slice(-2) || '88';
    return `012/2026-${cleanNum}`;
  }, [order.doNumber, order.orderNumber, order.id]);

  // PO Number
  const poNumber = useMemo(() => {
    if (order.poNumber) return order.poNumber;
    const cleanNum = (order.orderNumber || '04').replace(/\D/g, '').slice(-2) || '04';
    return cleanNum;
  }, [order.poNumber, order.orderNumber]);

  // Serial Numbers State (per line item)
  const [isEditingSerials, setIsEditingSerials] = useState(false);
  const [serialsMap, setSerialsMap] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {};
    (order.items || []).forEach((item, idx) => {
      if ((item as any).serialNumbers && Array.isArray((item as any).serialNumbers) && (item as any).serialNumbers.length > 0) {
        initial[idx] = (item as any).serialNumbers;
      } else {
        // Generate realistic serial numbers if not pre-set
        const count = item.quantity || 1;
        const base = 17158202615 + idx * 1000000;
        initial[idx] = Array.from({ length: count }, (_, i) => String(base + i * 5));
      }
    });
    return initial;
  });

  const handleSerialChange = (itemIdx: number, serialIdx: number, val: string) => {
    setSerialsMap((prev) => {
      const list = [...(prev[itemIdx] || [])];
      list[serialIdx] = val;
      return { ...prev, [itemIdx]: list };
    });
  };

  const handleSaveSerials = () => {
    setIsEditingSerials(false);
    if (onUpdateOrder) {
      const updatedItems = (order.items || []).map((it, idx) => ({
        ...it,
        serialNumbers: serialsMap[idx] || [],
      }));
      onUpdateOrder(order.id, {
        doNumber,
        items: updatedItems,
      });
    }
  };

  // Total Quantity Calculation
  const totalQty = useMemo(() => {
    return (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [order.items]);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmAcceptDO = () => {
    if (onAcceptDO) {
      onAcceptDO(order.id, {
        acceptedBy: acceptingPerson,
        notes: acceptanceNotes,
      });
    }
    setShowAcceptPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Container with print styles */}
      <div className="relative w-full max-w-4xl my-6 bg-slate-100 dark:bg-slate-950 rounded-2xl shadow-2xl p-2 sm:p-4 space-y-4">
        {/* Floating Top Control Toolbar (Hidden in Print) */}
        <div className="flex flex-col gap-2.5 bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Official Factory Delivery Order (D.O. #{doNumber})</span>
                  {isAccepted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Accepted by Factory
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Pending Factory Acceptance
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAccepted
                    ? `Reviewed & accepted by ${order.doAcceptedBy || 'Factory Concerned Person'} on ${order.doAcceptedAt ? new Date(order.doAcceptedAt).toLocaleDateString() : 'Today'}`
                    : 'Generated by Accounts Department — Requires Factory Review & Acceptance before Challan generation'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Accept DO Button if not yet accepted */}
              {!isAccepted && onAcceptDO && (
                <button
                  type="button"
                  onClick={() => setShowAcceptPrompt(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors"
                  title="Factory Concerned Person: Review and Accept this Delivery Order"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept D.O. (Factory)</span>
                </button>
              )}

              {/* Serials / Challan trigger if DO is accepted but Challan not yet generated */}
              {isAccepted && !order.challanNumber && onOpenSerialsAndChallan && (
                <button
                  type="button"
                  onClick={() => onOpenSerialsAndChallan(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-xs transition-colors"
                  title="Update battery serial numbers and generate official Factory Challan"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Update Serials &amp; Gen Challan</span>
                </button>
              )}

              {/* View Challan button only if Challan has been generated */}
              {order.challanNumber && onSwitchToChallan && (
                <button
                  type="button"
                  onClick={onSwitchToChallan}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer shadow-xs"
                  title="Switch to official Factory Challan copy"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Challan</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsEditingSerials(!isEditingSerials)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  isEditingSerials
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingSerials ? 'Done Editing' : 'Edit Battery Serials'}</span>
              </button>

              {isEditingSerials && (
                <button
                  type="button"
                  onClick={handleSaveSerials}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Serials</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white cursor-pointer shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print D.O.</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* DIALOG: FACTORY DO ACCEPTANCE CONFIRMATION */}
        {showAcceptPrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Factory D.O. Acceptance Review
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAcceptPrompt(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300">
                  Please review and accept Delivery Order <strong className="text-slate-900 dark:text-white font-mono">D.O. #{doNumber}</strong> for buyer <strong className="text-slate-900 dark:text-white">{buyerDetails.name}</strong> ({totalQty} units).
                </p>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Factory Concerned Person (Reviewer) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={acceptingPerson}
                    onChange={(e) => setAcceptingPerson(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Acceptance Notes &amp; Production Verification
                  </label>
                  <textarea
                    rows={2}
                    value={acceptanceNotes}
                    onChange={(e) => setAcceptanceNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAcceptPrompt(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAcceptDO}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Accept D.O. &amp; Proceed to Serials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PHYSICAL DELIVERY ORDER CANVAS (MATCHES SAMPLE IMAGE EXACTLY)       */}
        {/* =================================================================== */}
        <div
          id="delivery-order-canvas"
          className="bg-white text-black p-8 sm:p-12 shadow-md mx-auto font-sans border border-slate-300 max-w-[820px] print:m-0 print:p-8 print:w-full print:shadow-none print:border-none"
          style={{ minHeight: '1050px', fontFamily: '"Arial", "Helvetica", sans-serif' }}
        >
          {/* Top Logo Header - Attested ENSEC Pad Logo */}
          <div className="flex justify-end items-start mb-6">
            <div className="text-right">
              <img
                src="/assets/aistudio/image_dbec9d64.png"
                alt="ENSEC - Energy Security for a Sustainable World"
                className="h-14 sm:h-16 w-auto object-contain ml-auto print:h-14"
                loading="eager"
              />
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-6">
            <h1 className="text-2xl font-black tracking-wider uppercase underline underline-offset-4 decoration-2 text-black">
              DELIVERY ORDER
            </h1>
          </div>

          {/* Two-Column Meta Section */}
          <div className="grid grid-cols-12 gap-4 mt-8 mb-8 text-[13px] leading-relaxed text-black">
            {/* Left Column: Seller & Buyer info */}
            <div className="col-span-7 space-y-3">
              <div>
                <div className="font-bold text-[14px]">SELLER:</div>
                <div className="font-extrabold text-[15px]">ENSEC LIMITED</div>
                <div className="text-slate-800">Zirabo, Ashulia, Dhaka</div>
              </div>

              <div className="pt-2">
                <div className="text-slate-900">Buyer Name:</div>
                <div className="font-bold text-[14px] text-black">
                  {buyerDetails.name}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-slate-900">Delivery Address:</div>
                <div>Name: {buyerDetails.contactName}</div>
                <div>Address: {buyerDetails.address}</div>
                <div>Mobile: {buyerDetails.mobile}</div>
                <div>Buyer BIN: {buyerDetails.bin || '-'}</div>
              </div>
            </div>

            {/* Right Column: D/O, Date, PO, Place of Delivery */}
            <div className="col-span-5 space-y-2 text-left pl-4">
              <div className="font-semibold">
                D/O NO.: <span className="font-bold">{doNumber}</span>
              </div>
              <div className="font-semibold">
                DATE: <span className="font-bold">{formattedDate}</span>
              </div>
              <div className="font-semibold">
                PO NO.: <span className="font-bold">{poNumber}</span>
              </div>

              <div className="pt-4 font-bold text-[14px] tracking-wide">
                PLACE OF DELIVERY: <span className="underline">FACTORY</span>
              </div>
            </div>
          </div>

          {/* Items & Serial Numbers Table */}
          <div className="mt-8 mb-12">
            <table className="w-full border-collapse border border-black text-[13px] text-black">
              <thead>
                <tr className="border-b border-black text-center font-bold">
                  <th className="border-r border-black p-2.5 w-14">
                    SL.<br />NO.
                  </th>
                  <th className="border-r border-black p-2.5 text-center">
                    DESCRIPTION
                  </th>
                  <th className="border-r border-black p-2.5 text-center w-64">
                    PRODUCT SERIAL
                  </th>
                  <th className="p-2.5 text-center w-24">
                    QTY
                  </th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => {
                  const serials = serialsMap[idx] || [];

                  return (
                    <tr key={idx} className="border-b border-black align-top">
                      {/* SL NO */}
                      <td className="border-r border-black p-3 text-center font-semibold">
                        {idx + 1}.
                      </td>

                      {/* DESCRIPTION */}
                      <td className="border-r border-black p-3 font-bold text-[13px] uppercase">
                        {item.productName}
                      </td>

                      {/* PRODUCT SERIAL */}
                      <td className="border-r border-black p-3 text-left">
                        <div className="font-bold text-[12px] mb-1">BATTERY SL -</div>
                        {isEditingSerials ? (
                          <div className="space-y-1">
                            {serials.map((s, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-1 text-xs">
                                <span className="w-4 text-slate-500 font-mono">{sIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={s}
                                  onChange={(e) => handleSerialChange(idx, sIdx, e.target.value)}
                                  className="border border-slate-300 px-1 py-0.5 rounded text-xs font-mono w-full"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-0.5 font-mono text-[12px] pl-4">
                            {serials.map((s, sIdx) => (
                              <div key={sIdx}>
                                {sIdx + 1}. {s}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* QTY */}
                      <td className="p-3 text-center font-bold text-[13px]">
                        {String(item.quantity).padStart(2, '0')} Pcs
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL QTY ROW */}
                <tr className="font-black text-[13px]">
                  <td colSpan={3} className="border-r border-black p-2.5 text-right uppercase tracking-wider pr-6">
                    TOTAL QTY
                  </td>
                  <td className="p-2.5 text-center uppercase tracking-wider font-extrabold">
                    {String(totalQty).padStart(2, '0')} PCS
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures Block with Authentic Seal */}
          <div className="mt-24 pt-8">
            <div className="grid grid-cols-4 gap-4 items-end text-center text-[12px] font-bold">
              {/* Prepared by */}
              <div>
                <div className="border-t border-black pt-1.5 uppercase font-bold text-black">
                  Prepared by
                </div>
              </div>

              {/* Approved By */}
              <div>
                <div className="border-t border-black pt-1.5 uppercase font-bold text-black">
                  Approved By
                </div>
              </div>

              {/* A/C Department */}
              <div>
                <div className="border-t border-black pt-1.5 uppercase font-bold text-black">
                  A/C Department
                </div>
              </div>

              {/* Authorized By */}
              <div>
                <div className="border-t border-black pt-1.5 uppercase font-bold text-black">
                  Authorized By
                </div>
              </div>
            </div>
          </div>

          {/* Footer Address */}
          <div className="mt-20 pt-3 border-t border-slate-400 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-black" />
              <span>5th Floor, Taher Tower, Plot-10, Gulshan 2, Dhaka- 1212</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-black" />
              <span>+88 02222294465</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-black" />
              <span>info.ensec@aman.group</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
