import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://inguuoiolmbplubkwcvd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZ3V1b2lvbG1icGx1Ymt3Y3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDIxMjksImV4cCI6MjA4NjA3ODEyOX0.wRTnc2LRoy4d77K7RWOeglfsO51kCfN3NlRB7UvyD4Y"
);

// Global variables
let depositsData = [];
let currentAgent = null;

// Initialize page
window.onload = async () => {
  await loadAgentInfo();
  await loadDeposits();
  attachEventListeners();
};

function attachEventListeners() {
  document.getElementById('depositForm')?.addEventListener('submit', submitDeposit);
  document.getElementById('amountInput')?.addEventListener('input', validateAmount);
  document.getElementById('paymentMethod')?.addEventListener('change', updatePaymentDetails);
  
  // Payment method selection
  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', function() {
      selectPaymentMethod(this);
    });
  });
}

// Select payment method
function selectPaymentMethod(element) {
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
  element.classList.add('selected');
  document.getElementById('paymentMethod').value = element.dataset.method;
  
  // Show/hide transaction number field
  const transactionField = document.getElementById('transactionField');
  if (element.dataset.method === 'cash') {
    transactionField.style.display = 'none';
    document.getElementById('transactionNumber').required = false;
  } else {
    transactionField.style.display = 'block';
    document.getElementById('transactionNumber').required = true;
  }
}

// Load agent information
async function loadAgentInfo() {
  const agentId = localStorage.getItem('agent_id');
  if (!agentId) {
    window.location.href = 'index.html';
    return;
  }

  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    console.error('Error loading agent info:', error);
    alert('حدث خطأ في تحميل معلومات المندوب');
    return;
  }

  currentAgent = agent;
  document.getElementById('agentName').textContent = agent.name;
  document.getElementById('agentBalance').textContent = `${agent.balance || 0} ج.م`;
}

// Load deposits history
async function loadDeposits() {
  const agentId = localStorage.getItem('agent_id');
  const { data: deposits, error } = await supabase
    .from('deposits')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading deposits:', error);
    return;
  }

  depositsData = deposits || [];
  displayDeposits(depositsData);
  updateStatistics();
}

// Display deposits in table
function displayDeposits(deposits) {
  const tbody = document.getElementById('depositsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!deposits || deposits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">لا توجد توريدات حالياً</td></tr>';
    return;
  }

  deposits.forEach(deposit => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(deposit.created_at)}</td>
      <td>${deposit.amount} ج.م</td>
      <td>${getPaymentMethodLabel(deposit.payment_method)}</td>
      <td>${deposit.transaction_number || '-'}</td>
      <td>${getStatusLabel(deposit.status)}</td>
      <td>${deposit.notes || '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

// Submit new deposit
async function submitDeposit(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amountInput').value);
  const paymentMethod = document.getElementById('paymentMethod').value;
  const transactionNumber = document.getElementById('transactionNumber').value.trim();
  const notes = document.getElementById('notesInput').value.trim();

  if (!amount || amount <= 0) {
    alert('يرجى إدخال مبلغ صحيح');
    return;
  }

  if (!paymentMethod) {
    alert('يرجى اختيار طريقة الدفع');
    return;
  }

  // Validate required fields based on payment method
  if (paymentMethod !== 'cash' && !transactionNumber) {
    alert('يرجى إدخال رقم المعاملة');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('deposits')
      .insert([{
        agent_id: currentAgent.id,
        amount: amount,
        payment_method: paymentMethod,
        transaction_number: transactionNumber || null,
        notes: notes || null,
        status: 'pending', // Pending admin approval
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error submitting deposit:', error);
      alert('حدث خطأ في إرسال التوريد: ' + error.message);
      return;
    }

    alert('✅ تم إرسال التوريد بنجاح! في انتظار موافقة المدير');
    
    // Reset form
    document.getElementById('depositForm').reset();
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    document.getElementById('transactionField').style.display = 'none';
    document.getElementById('submitBtn').disabled = true;
    
    // Reload deposits
    await loadDeposits();

  } catch (error) {
    console.error('Unexpected error:', error);
    alert('حدث خطأ غير متوقع');
  }
}

// Validate amount input
function validateAmount(e) {
  const value = parseFloat(e.target.value);
  const submitBtn = document.getElementById('submitBtn');
  
  if (value && value > 0) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

// Update payment details based on payment method
function updatePaymentDetails(e) {
  const paymentMethod = e.target.value;
  const transactionField = document.getElementById('transactionField');
  
  if (paymentMethod === 'cash') {
    transactionField.style.display = 'none';
    document.getElementById('transactionNumber').required = false;
  } else {
    transactionField.style.display = 'block';
    document.getElementById('transactionNumber').required = true;
  }
}

// Update statistics
function updateStatistics() {
  const totalDeposits = depositsData.reduce((sum, d) => sum + d.amount, 0);
  const pendingDeposits = depositsData.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
  const approvedDeposits = depositsData.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0);

  document.getElementById('totalDeposits').textContent = `${totalDeposits} ج.م`;
  document.getElementById('pendingDeposits').textContent = `${pendingDeposits} ج.م`;
  document.getElementById('approvedDeposits').textContent = `${approvedDeposits} ج.م`;
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG') + ' ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function getPaymentMethodLabel(method) {
  const labels = {
    'cash': 'نقدي',
    'instapay': 'انستا باي',
    'wallet': 'محفظة إلكترونية',
    'bank': 'تحويل بنكي'
  };
  return labels[method] || method;
}

function getStatusLabel(status) {
  const labels = {
    'pending': '<span style="color: #ffc107;">⏳ في الانتظار</span>',
    'approved': '<span style="color: #28a745;">✅ موافق عليه</span>',
    'rejected': '<span style="color: #dc3545;">❌ مرفوض</span>'
  };
  return labels[status] || status;
}

// Export functions for global access
window.selectPaymentMethod = selectPaymentMethod;
window.submitDeposit = submitDeposit;
window.validateAmount = validateAmount;
window.updatePaymentDetails = updatePaymentDetails;
