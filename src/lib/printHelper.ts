/**
 * Universal Print Utility for Lao Official Reports
 * Supports printing across all 5 systems:
 * 1. Meeting Room Booking Reports (ReportSystem)
 * 2. Vehicle Fleet Usage Reports (VehicleReports)
 * 3. Civil Servants / HR Reports (HRReports)
 * 4. Staff Leave Quota Reports (LeaveReports)
 * 5. Leadership Activities Reports (LeadershipReports)
 */

export function printReportDocument(
  elementId: string = "print-report-sheet",
  documentTitle: string = "ບົດລາຍງານທາງການ"
) {
  // Find printable element by id or by class
  let target = document.getElementById(elementId);
  if (!target) {
    target = document.querySelector(".print-report-sheet") as HTMLElement | null;
  }

  // If still not found, fallback to browser native print
  if (!target) {
    window.print();
    return;
  }

  try {
    // Create an invisible, isolated iframe to print strictly the report container
    const iframe = document.createElement("iframe");
    iframe.name = "print-report-frame";
    iframe.id = "print-report-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "-9999";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    // Collect all stylesheets and style blocks from current document
    const headNodes = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style")
    );
    let stylesHtml = "";
    headNodes.forEach((node) => {
      stylesHtml += node.outerHTML + "\n";
    });

    // Write document into iframe
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="lo">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${documentTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@300;400;500;600;700;800;900&family=Noto+Serif+Lao:wght@400;700&display=swap" rel="stylesheet">
    ${stylesHtml}
    <style>
      @page {
        size: A4 portrait;
        margin: 12mm 15mm 15mm 15mm;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        background-color: #ffffff !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Noto Sans Lao', 'Phetsarath', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-size: 11pt;
      }
      /* Ensure everything in dark mode flips to pure white in print */
      .dark, [data-theme="dark"] {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
      /* Hide elements marked print:hidden */
      .print\\:hidden, 
      [data-print-hidden="true"], 
      button, 
      input, 
      select, 
      textarea {
        display: none !important;
      }
      /* Clean table printing */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      tr {
        page-break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
      /* Remove shadows and rounded borders for crisp physical output */
      .shadow-xl, .shadow-2xl, .shadow-lg, .shadow-md, .shadow-sm {
        box-shadow: none !important;
      }
      .rounded-3xl, .rounded-2xl {
        border-radius: 0px !important;
      }
      .print-report-sheet {
        display: block !important;
        width: 100% !important;
        background: #ffffff !important;
        color: #0f172a !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
      }
    </style>
  </head>
  <body class="bg-white text-slate-950 p-2">
    <div class="print-report-sheet">
      ${target.innerHTML}
    </div>
  </body>
</html>`);
    doc.close();

    // Trigger print once DOM & images inside iframe have loaded
    const triggerIframePrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn("Iframe print caught exception, using window.print():", e);
        window.print();
      } finally {
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch (cleanErr) {}
        }, 1500);
      }
    };

    if (iframe.contentWindow?.document.readyState === "complete") {
      setTimeout(triggerIframePrint, 300);
    } else {
      iframe.onload = () => {
        setTimeout(triggerIframePrint, 300);
      };
      // Safety fallback timer in case onload doesn't fire
      setTimeout(triggerIframePrint, 600);
    }
  } catch (error) {
    console.error("printReportDocument failed, falling back to window.print():", error);
    window.print();
  }
}
