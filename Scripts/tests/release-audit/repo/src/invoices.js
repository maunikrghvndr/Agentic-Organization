export function listInvoices(req, db) {
  const tenant = req.query.tenant;
  return db.query("select * from invoices where tenant = $1", [tenant]);
}
