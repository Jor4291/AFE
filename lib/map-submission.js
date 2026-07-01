function isReplacement(reqType) {
  return String(reqType || '').toLowerCase().includes('replacement');
}

function deriveStage(row) {
  const status = Number(row.status);
  const finalApproval = Number(row.final_approval);
  const cirrusStatus = Number(row.cirrus_status);

  if (status === 2 || status === 4 || finalApproval === 2) {
    return 'denied';
  }

  if (status === 0 || status === 3) {
    return 'bu_review';
  }

  if (status !== 1) {
    return 'bu_review';
  }

  const replacement = isReplacement(row.req_type);

  if (!replacement && finalApproval === 0) {
    return 'reviewer_review';
  }

  if (cirrusStatus === 4) return 'ordered';
  if (cirrusStatus === 1) return 'shipped';
  if (cirrusStatus === 2) return 'received';

  return 'approved';
}

function buStatusLabel(status) {
  const labels = {
    0: 'Pending',
    1: 'Accepted',
    2: 'Denied',
    3: 'Further info requested',
    4: 'Cancelled',
  };
  return labels[Number(status)] || 'Unknown';
}

function finalStatusLabel(finalApproval) {
  const labels = { 0: 'Pending', 1: 'Approved', 2: 'Denied' };
  return labels[Number(finalApproval)] || 'Unknown';
}

function fulfilmentLabel(cirrusStatus) {
  const labels = {
    0: 'Processing',
    4: 'Ordered',
    1: 'Shipped',
    2: 'Received',
    3: 'Further info requested',
  };
  return labels[Number(cirrusStatus)] || null;
}

function buildAudit(row, stage) {
  const audit = [{ action: 'Submitted', actor: row.requester || `${row.f_name} ${row.l_name}`, at: row.sub_date }];

  if (Number(row.status) >= 1 && row.status !== '0') {
    audit.push({
      action: `BU Leader: ${buStatusLabel(row.status)}`,
      actor: row.submit_to || 'BU Leader',
      at: row.manager_app_date || row.sub_date,
    });
  }

  if (!isReplacement(row.req_type) && Number(row.final_approval) > 0) {
    audit.push({
      action: `Final approval: ${finalStatusLabel(row.final_approval)}`,
      actor: 'Reviewer',
      at: row.final_app_date || row.manager_app_date || row.sub_date,
    });
  }

  if (isReplacement(row.req_type) && Number(row.status) === 1) {
    audit.push({
      action: 'Approved — sent to Helpdesk',
      actor: row.submit_to || 'BU Leader',
      at: row.manager_app_date || row.sub_date,
    });
  }

  const fulfilment = fulfilmentLabel(row.cirrus_status);
  if (fulfilment && ['ordered', 'shipped', 'received', 'approved'].includes(stage)) {
    audit.push({ action: fulfilment, actor: 'Help Desk', at: row.sub_date });
  }

  return audit;
}

function mapSubmission(row) {
  const type = isReplacement(row.req_type) ? 'replacement' : 'new_equipment';
  const stage = deriveStage(row);

  return {
    id: row.id,
    number: row.id,
    first: row.f_name,
    last: row.l_name,
    type,
    equipment: row.equip_type,
    office: row.office,
    businessUnit: row.bus_unit,
    costCenter: row.cost_center,
    reason: row.notes || row.description || row.reason || '',
    submitTo: row.submit_to,
    stage,
    audit: buildAudit(row, stage),
    submittedAt: row.sub_date,
    email: row.email,
    jobTitle: row.job_title,
  };
}

module.exports = { mapSubmission, deriveStage };
