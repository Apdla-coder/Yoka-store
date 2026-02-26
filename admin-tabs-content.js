// ============================================================
// دالة حساب المبلغ المستحق على العميل
// المبلغ = سعر الباقة + الديون المتراكمة + أي مبلغ إضافي
// ============================================================
function calculateAmount(customer, collectionAmounts = {}) {
    if (customer.collection_status === 'تم التحصيل') return 0;
    const pkg = parseFloat(customer.package_price || 0) || 0;
    const debt = parseFloat(customer.debt_amount || 0) || 0;
    const due = parseFloat(customer.due_amount || 0) || 0;
    return pkg + debt + due;
}

// دالة لتحديث إجمالي الصف عند تغيير السعر أو الدين
window.updateRowTotal = function (input) {
    const row = input.closest('tr');
    if (!row) return;

    const rowInputs = row.querySelectorAll('.table-input');
    const totalInput = row.querySelector('.table-total');
    if (!totalInput) return;

    let total = 0;
    rowInputs.forEach(inp => {
        const field = inp.dataset.field;
        if (field === 'package_price' || field === 'debt_amount') {
            total += parseFloat(inp.value) || 0;
        }
    });

    totalInput.value = total.toFixed(2);
};

// Load Management Content
async function loadManagementContent(container) {
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">👥 إدارة العملاء</h2>
            <p style="color: #666;">إدارة عملاء المناديب والتحصيلات</p>
        </div>
        
        <!-- Advanced Filters -->
        <div style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h4 style="margin: 0 0 1rem 0;">🔍 الفلاتر المتقدمة</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">اختر مندوب</label>
                    <select id="adminAgentSelect" class="form-control">
                        <option value="">-- اختر --</option>
                    </select>
                    <small id="agentStatus" style="color: #666; font-size: 12px; margin-top: 5px; display: block;">جاري التحميل...</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">تصفية حسب القسم</label>
                    <select id="sectionFilter" class="form-control">
                        <option value="">كل الأقسام</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">حالة التحصيل</label>
                    <select id="statusFilter" class="form-control">
                        <option value="">كل الحالات</option>
                        <option value="تم التحصيل">تم التحصيل</option>
                        <option value="لم يتم التحصيل">لم يتم التحصيل</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">البحث عن عميل</label>
                    <input type="text" id="searchInput" class="form-control" placeholder="ابحث بالاسم أو الهاتف...">
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div id="quickStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #007bff;" id="totalCount">0</div>
                    <div style="color: #666; font-size: 0.9rem;">إجمالي العملاء</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #28a745;" id="collectedCount">0</div>
                    <div style="color: #666; font-size: 0.9rem;">تم التحصيل</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #dc3545;" id="pendingCount">0</div>
                    <div style="color: #666; font-size: 0.9rem;">لم يتم</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #ffc107;" id="totalAmount">0</div>
                    <div style="color: #666; font-size: 0.9rem;">إجمالي المبلغ</div>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
            <button onclick="addCustomer()" class="btn btn-primary">
                <span>➕ إضافة عميل</span>
            </button>
            <button onclick="clearAllCustomers()" class="btn btn-danger">
                <span>🗑️ حذف الكل</span>
            </button>
            <button onclick="exportToExcel()" class="btn btn-success">
                <span>📊 تصدير Excel</span>
            </button>
            <button onclick="resetFilters()" class="btn btn-secondary">
                <span>🔄 إعادة تعيين الفلاتر</span>
            </button>
            <button onclick="showCollectionHistory()" class="btn btn-info" style="background: linear-gradient(45deg, #17a2b8, #138496); border: none;">
                <span>📜 سجل التحصيل</span>
            </button>
        </div>
        
        <!-- Collection Period Status -->
        <div id="collectionPeriodStatus" style="background: white; padding: 1rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-right: 4px solid #ff6b35;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: #ff6b35;">📅 حالة فترة التحصيل الحالية</h4>
                    <p id="currentPeriodInfo" style="margin: 0; color: #666; font-size: 0.9rem;">جاري تحميل معلومات الفترة...</p>
                    <div style="margin-top: 0.5rem;">
                        <button onclick="startNewPeriod(event)" class="btn btn-success" style="background: #28a745; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; font-size: 0.9rem;">
                            🚀 بدء فترة جديدة
                        </button>
                    </div>
                </div>
                <div style="text-align: left;">
                    <div style="font-size: 0.9rem; color: #666;">العملاء المتأخرين</div>
                    <div id="overdueCustomersCount" style="font-size: 1.5rem; font-weight: bold; color: #dc3545;">0</div>
                </div>
            </div>
        </div>
        
        <!-- Sections Container -->
        <div id="sectionsContainer">
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    // Initialize management functionality
    await initializeManagement();
}

// Load customers by agent - Define globally first
window.loadCustomersByAgent = async function (container) {
    const agentSelect = document.getElementById("adminAgentSelect");
    const searchInput = document.getElementById("customerSearch");
    const sectionFilter = document.getElementById("sectionFilter");

    // Always use sectionsContainer for customers data to preserve page layout
    container = document.getElementById("sectionsContainer");

    if (!container) {
        console.error("❌ Sections container not found");
        return;
    }

    console.log("🔍 Container found:", container.id);
    console.log("🔍 Container HTML:", container.innerHTML.substring(0, 200) + "...");

    console.log("📦 Using container:", container.id || container.className);

    const agentId = agentSelect?.value;
    console.log("🔄 loadCustomersByAgent called with agentId:", agentId);

    if (!agentId) {
        console.log("⚠️ No agent selected");
        container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">👤</div><h3>اختر مندوباً لعرض العملاء</h3></div>';
        window.updateQuickStats([]);
        return;
    }

    try {
        // Show custom loading to avoid conflicts
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; color: #666;">
                <div style="
                    width: 40px; height: 40px; 
                    border: 3px solid rgba(255, 107, 53, 0.2);
                    border-top: 3px solid #ff6b35;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                "></div>
                <div>جاري تحميل البيانات...</div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;

        // Add timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            console.warn("⏰ Loading timeout - showing error message");
            container.innerHTML = '<div class="error-section">⏰ استغرق التحميل وقتاً طويلاً. يرجى تحديث الصفحة والمحاولة مرة أخرى.</div>';
        }, 10000); // 10 seconds timeout

        console.log("📥 Loading customers for agent:", agentId);

        // Get customers for this agent
        const { data: customers, error } = await supabaseClient
            .from("customers")
            .select("*")
            .eq("agent_id", agentId)
            .order("section", { ascending: true })
            .order("created_at", { ascending: true });

        clearTimeout(loadingTimeout);

        if (error) {
            console.error("❌ Error loading customers:", error);
            container.innerHTML = `<div class="error-section">❌ خطأ في تحميل العملاء: ${error.message}</div>`;
            return;
        }

        console.log("📊 Raw customer data from database:", customers);
        console.log("📊 First customer sample:", customers?.[0]);
        console.log("📊 Customer fields:", customers?.[0] ? Object.keys(customers[0]) : 'No customers');
        console.log("📊 Package prices sample:", customers?.slice(0, 5).map(c => ({
            id: c.id,
            name: c.name,
            package_price: c.package_price,
            debt_amount: c.debt_amount
        })));
        console.log("📊 Due amounts:", customers?.map(c => ({ id: c.id, name: c.name, debt_amount: c.debt_amount, package_price: c.package_price })));

        if (!customers || customers.length === 0) {
            console.log("📭 No customers found for this agent");
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">📭</div><h3>لا يوجد عملاء لهذا المندوب</h3><p>يمكنك إضافة عملاء جدد باستخدام زر "إضافة عميل"</p></div>';
            window.updateQuickStats([]);
            return;
        }

        console.log("📊 Customers loaded:", customers);
        console.log("📊 Customers count:", customers.length);

        // Get collections for these customers to store globally for export/stats
        const customerIds = customers.map(c => c.id);
        const { data: collections, error: collectionsError } = await supabaseClient
            .from('collections')
            .select('*')
            .in('customer_id', customerIds)
            .order('created_at', { ascending: false });

        const collectionData = {};
        if (!collectionsError && collections) {
            collections.forEach(col => {
                if (!collectionData[col.customer_id]) {
                    const amount = col.amount || col.original_amount || col.debt_amount || 0;
                    collectionData[col.customer_id] = {
                        amount: parseFloat(amount) || 0,
                        date: col.created_at ? new Date(col.created_at).toLocaleDateString('ar-SA') : '-'
                    };
                }
            });
        }
        window.currentCollectionData = collectionData;
        console.log("📊 Collection data loaded globally:", collectionData);

        // Set global variable for filtering
        window.currentCustomers = customers;

        // Update quick stats
        window.updateQuickStats(window.currentCustomers);

        console.log("🔄 Rendering sections...");
        window.renderCustomersBySection(window.currentCustomers, container);

        // Update collection period status
        window.updateCollectionPeriodStatus();

    } catch (error) {
        console.error("❌ Error in loadCustomersByAgent:", error);
        container.innerHTML = `<div class="error-section">❌ حدث خطأ أثناء تحميل البيانات: ${error.message}</div>`;
    }
};

// Initialize Management Functionality
async function initializeManagement() {
    console.log('🚀 Initializing management functionality...');

    // Use global Supabase client
    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return;
    }

    // Get elements
    const agentSelect = document.getElementById("adminAgentSelect");
    const sectionFilter = document.getElementById("sectionFilter");
    const searchInput = document.getElementById("searchInput");
    const container = document.getElementById("sectionsContainer");
    const statusElement = document.getElementById("agentStatus");
    let currentCustomers = [];

    // Load agents
    await loadAgents();

    async function loadAgents() {
        try {
            console.log('📥 Loading agents...');

            if (statusElement) statusElement.textContent = "جاري تحميل المناديب...";

            if (!agentSelect) {
                console.error("❌ Agent select element not found!");
                return;
            }

            // Test database connection first
            console.log("🔌 Testing database connection...");
            const { data: testData, error: testError } = await supabaseClient
                .from('agents')
                .select('id')
                .limit(1);

            if (testError) {
                console.error("❌ Database connection test failed:", testError);
                if (statusElement) {
                    statusElement.textContent = "❌ فشل الاتصال بقاعدة البيانات";
                    statusElement.style.color = "red";
                }
                alert("فشل الاتصال بقاعدة البيانات: " + testError.message);
                return;
            }

            console.log("✅ Database connection successful");

            // Load agents
            const { data: agents, error } = await supabaseClient
                .from("agents")
                .select("*")
                .order("name");

            if (error) {
                console.error("❌ Error loading agents:", error);
                if (statusElement) {
                    statusElement.textContent = "❌ خطأ في تحميل المناديب";
                    statusElement.style.color = "red";
                }
                alert("حدث خطأ في تحميل المناديب: " + error.message);
                return;
            }

            console.log("📊 Agents loaded:", agents);

            if (!agents || agents.length === 0) {
                console.warn("⚠️ No agents found in database");
                if (statusElement) {
                    statusElement.textContent = "⚠️ لا يوجد مناديب";
                    statusElement.style.color = "orange";
                }
                alert("لا يوجد مناديب في قاعدة البيانات. يرجى إضافة مناديب أولاً.");
                return;
            }

            // Clear existing options except the first one
            agentSelect.innerHTML = '<option value="">-- اختر --</option>';
            console.log("🔄 Cleared dropdown, adding agents...");

            agents?.forEach((a, index) => {
                console.log(`📝 Adding agent ${index + 1}:`, a);
                const opt = document.createElement("option");
                opt.value = a.id;
                opt.textContent = a.name;
                agentSelect.appendChild(opt);
            });

            console.log("✅ Agents added to dropdown. Total options:", agentSelect.options.length);

            // Update status
            if (statusElement) {
                statusElement.textContent = `✅ تم تحميل ${agents.length} مندوب`;
                statusElement.style.color = "green";
            }

        } catch (err) {
            console.error("❌ Unexpected error in loadAgents:", err);
            if (statusElement) {
                statusElement.textContent = "❌ خطأ غير متوقع";
                statusElement.style.color = "red";
            }
            alert("خطأ غير متوقع: " + err.message);
        }
    }

    // Event listeners
    agentSelect.addEventListener("change", () => window.loadCustomersByAgent(container));
    searchInput.addEventListener("input", () => window.filterCustomers());
    sectionFilter.addEventListener("change", () => window.filterCustomers());

    // Add status filter listener
    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", () => window.filterCustomers());
    }

    // Update quick stats - Define globally
    window.updateQuickStats = function (customers) {
        const totalCount = document.getElementById('totalCount');
        const collectedCount = document.getElementById('collectedCount');
        const pendingCount = document.getElementById('pendingCount');
        const totalAmount = document.getElementById('totalAmount');

        const total = customers.length;
        const collected = customers.filter(c => c.collection_status === 'تم التحصيل').length;
        const pending = total - collected;

        // Amount calculation uses helper to ensure full due is counted
        const amount = customers.reduce((sum, c) => {
            if (c.collection_status === 'تم التحصيل') return sum;
            return sum + calculateAmount(c);
        }, 0);

        if (totalCount) totalCount.textContent = total;
        if (collectedCount) collectedCount.textContent = collected;
        if (pendingCount) pendingCount.textContent = pending;
        if (totalAmount) totalAmount.textContent = amount.toFixed(2);
    }

    // Advanced filter function - Define globally
    window.filterCustomers = function (container) {
        const searchInput = document.getElementById("searchInput");  // Fixed: was "customerSearch"
        const sectionFilter = document.getElementById("sectionFilter");
        const searchTerm = searchInput?.value?.toLowerCase() || '';
        const selectedSection = sectionFilter?.value || '';
        const selectedStatus = document.getElementById("statusFilter")?.value || '';

        // Always use sectionsContainer for customers data to preserve page layout
        container = document.getElementById("sectionsContainer");

        if (!container) {
            console.error("❌ Sections container not found for filtering");
            return;
        }

        console.log("🔍 filterCustomers - Container found:", container.id);
        console.log("🔍 filterCustomers - Container HTML before:", container.innerHTML.substring(0, 200) + "...");

        let filtered = [...(window.currentCustomers || [])];

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.name?.toLowerCase().includes(searchTerm) ||
                c.phone?.includes(searchTerm)
            );
        }

        if (selectedSection) {
            filtered = filtered.filter(c => c.section === selectedSection);
        }

        if (selectedStatus) {
            filtered = filtered.filter(c => c.collection_status === selectedStatus);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">🔍</div><h3>لا توجد نتائج</h3><p>جرب تغيير معايير البحث</p></div>';
        } else {
            window.renderCustomersBySection(filtered, container);
        }
    };

    // Reset filters function
    window.resetFilters = () => {
        const searchInput = document.getElementById("customerSearch");
        const sectionFilter = document.getElementById("sectionFilter");
        searchInput.value = '';
        sectionFilter.value = '';
        if (document.getElementById("statusFilter")) {
            document.getElementById("statusFilter").value = '';
        }
        if (window.currentCustomers.length > 0) {
            const container = document.getElementById("sectionsContainer");
            window.renderCustomersBySection(window.currentCustomers, container);
        }
    };

    // Render customers by section - Define globally
    window.renderCustomersBySection = function (customers, container) {
        console.log(" Grouping customers by section...");

        // Always use sectionsContainer for customers data to preserve page layout
        container = document.getElementById("sectionsContainer");

        if (!container) {
            console.error("❌ Sections container not found for rendering");
            return;
        }

        console.log("🔍 renderCustomersBySection - Container found:", container.id);
        console.log("🔍 renderCustomersBySection - Container HTML before:", container.innerHTML.substring(0, 200) + "...");

        console.log("📦 Rendering in container:", container.id || container.className);

        // Get collections for amount mapping (same logic as collections.html)
        const supabaseClient = window.supabaseClient;
        let collectionAmounts = {};

        // Try to get collections data for correct amounts
        if (supabaseClient && customers.length > 0) {
            const customerIds = customers.map(c => c.id);
            supabaseClient
                .from('collections')
                .select('*')
                .in('customer_id', customerIds)
                .then(({ data: collections }) => {
                    collections?.forEach(collection => {
                        if (collection.customer_id) {
                            // Use same logic as collections.html - try multiple amount fields
                            const amount = collection.amount || collection.original_amount || collection.debt_amount || 0;
                            collectionAmounts[collection.customer_id] = parseFloat(amount) || 0;
                        }
                    });
                    console.log(' Collection amounts map:', collectionAmounts);
                })
                .catch(error => {
                    console.warn(' Could not load collections for amounts:', error);
                });
        }

        const grouped = customers.reduce((acc, customer) => {
            const section = customer.section || "غير محدد";
            if (!acc[section]) acc[section] = [];
            acc[section].push(customer);
            return acc;
        }, {});

        console.log(" Grouped customers:", grouped);

        // Update section filter
        const sections = Object.keys(grouped).sort();
        sectionFilter.innerHTML = '<option value="">كل الأقسام</option>';
        sections.forEach(section => {
            const option = document.createElement("option");
            option.value = section;
            option.textContent = section;
            sectionFilter.appendChild(option);
        });

        console.log(" Updated section filter with sections:", sections);

        // Render sections
        let html = "";

        for (const [section, sectionCustomers] of Object.entries(grouped)) {
            console.log(` Rendering section: ${section} with ${sectionCustomers.length} customers`);

            const safeId = section.replace(/[^\w\-]/g, "-");
            const inputId = `sectionInput-${safeId}`;
            const saveBtnId = `saveBtn-${safeId}`;

            // Calculate statistics with correct amounts (package prices + carried over amounts)
            const totalCustomers = sectionCustomers.length;
            const collectedCount = sectionCustomers.filter(c => c.collection_status === "تم التحصيل").length;
            const pendingCount = sectionCustomers.filter(c => c.collection_status !== "تم التحصيل").length;

            // Process customers to calculate correct amounts
            const processedSectionCustomers = sectionCustomers.map(customer => {
                // compute full amount using helper
                const amount = calculateAmount(customer, collectionAmounts);
                return {
                    ...customer,
                    display_amount: parseFloat(amount) || 0
                };
            });

            // إنشاء خريطة للوصول السريع للبيانات المعالجة
            const processedCustomerMap = {};
            processedSectionCustomers.forEach(customer => {
                processedCustomerMap[customer.id] = customer;
            });

            // Calculate totals using helper which includes package, debt, due, and recorded amounts
            const totalAmount = sectionCustomers.reduce((sum, c) => sum + calculateAmount(c), 0);
            const collectedAmount = sectionCustomers
                .filter(c => c.collection_status === "تم التحصيل")
                .reduce((sum, c) => sum + calculateAmount(c), 0);
            const pendingAmount = totalAmount - collectedAmount;

            console.log(` Section stats - Total: ${totalCustomers}, Collected: ${collectedCount}, Pending: ${pendingCount}`);

            // تجميع الشرائح المتعددة لنفس العميل
            const groupedCustomers = {};
            processedSectionCustomers.forEach(customer => {
                const name = (customer.name || '').trim().toLowerCase();
                if (!groupedCustomers[name]) {
                    groupedCustomers[name] = {
                        originalName: customer.name || 'غير معروف',
                        customers: [],
                        totalAmount: 0,
                        allPhones: new Set(),
                        allAddresses: new Set(),
                        allPackages: new Set(),
                        allSections: new Set(),
                        ids: [],
                        collectedCount: 0,
                        pendingCount: 0
                    };
                }
                groupedCustomers[name].customers.push(customer);
                groupedCustomers[name].ids.push(customer.id);

                // الحساب الصحيح: إذا كان محصلاً، المبلغ المتبقي 0، وإلا فهو الناتج من calculateAmount
                const amountToAdd = customer.collection_status === "تم التحصيل" ? 0 : calculateAmount(customer);
                groupedCustomers[name].totalAmount += amountToAdd;

                const phone = customer.phone || 'غير محدد';
                if (phone && phone !== 'غير محدد') {
                    groupedCustomers[name].allPhones.add(phone);
                }

                const address = customer.address || 'غير محدد';
                if (address && address !== 'غير محدد') {
                    groupedCustomers[name].allAddresses.add(address);
                }

                // إضافة الباقة/الشريحة
                const servicePackage = customer.package || customer.package_name || customer.service_type || 'شريحة أساسية';
                groupedCustomers[name].allPackages.add(servicePackage);

                // إضافة القسم
                const section = customer.section || 'غير محدد';
                if (section && section !== 'غير محدد') {
                    groupedCustomers[name].allSections.add(section);
                }

                if (customer.collection_status === "تم التحصيل") {
                    groupedCustomers[name].collectedCount++;
                } else {
                    groupedCustomers[name].pendingCount++;
                }
            });

            // Debug only the final totals
            Object.keys(groupedCustomers).forEach(groupName => {
                const group = groupedCustomers[groupName];
                console.log(`💰 Group ${group.originalName}:`, {
                    totalAmount: group.totalAmount,
                    totalAmountType: typeof group.totalAmount,
                    totalAmountFixed: group.totalAmount.toFixed(2),
                    customersCount: group.customers.length,
                    customerPrices: group.customers.map(c => ({
                        name: c.name,
                        package_price: c.package_price,
                        debt_amount: c.debt_amount
                    }))
                });
            });

            // Debug before rendering HTML
            Object.keys(groupedCustomers).forEach(groupName => {
                const group = groupedCustomers[groupName];
                console.log(`🔍 BEFORE RENDER - Group ${group.originalName}: totalAmount = ${group.totalAmount}, will show: ${group.totalAmount.toFixed(2)}`);
            });

            html += `
                <div class="section-block" style="margin-bottom: 2rem; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
                    <div class="section-header" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem;">
                        <div class="section-title" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <span>📁</span>
                            <input id="${inputId}" class="section-name-input" value="${section}" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.5rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600;" />
                            <button id="${saveBtnId}" class="btn btn-sm" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">💾 حفظ</button>
                        </div>
                        <div class="section-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.9rem;">
                            <div><strong>👥 إجمالي العملاء:</strong> ${totalCustomers}</div>
                            <div><strong>✅ تم التحصيل:</strong> ${collectedCount}</div>
                            <div><strong>⏳ لم يتم التحصيل:</strong> ${pendingCount}</div>
                            <div><strong>💰 إجمالي المبلغ:</strong> ${totalAmount.toFixed(2)} ج.م</div>
                            <div><strong>💵 تم تحصيله:</strong> ${collectedAmount.toFixed(2)} ج.م</div>
                            <div><strong>⏰ المتبقي:</strong> ${pendingAmount.toFixed(2)} ج.م</div>
                        </div>
                    </div>
                    <div class="section-content" style="padding: 1.5rem;">
                        <div style="overflow-x: auto;">
                            <table class="customers-table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f8f9fa;">
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">اسم العميل</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الشرائح</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">سعر الباقة</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">المبالغ المتأخرة</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الهواتف</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">العناوين</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">إجمالي المبلغ المستحق</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الحالة</th>
                                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.values(groupedCustomers)
                    .map(
                        (group) => {
                            const phonesArray = Array.from(group.allPhones);
                            const addressesArray = Array.from(group.allAddresses);
                            const packagesArray = Array.from(group.allPackages);
                            const sectionsArray = Array.from(group.allSections);
                            const isCollected = group.collectedCount > 0 && group.pendingCount === 0;

                            return `
                                        <tr style="border-bottom: 1px solid #eee; ${group.customers.length > 1 ? 'background: linear-gradient(90deg, rgba(0, 123, 255, 0.1), rgba(0, 123, 255, 0.05));' : ''}">
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                                    <input data-id="${group.ids[0]}" data-field="name" class="table-input" value="${group.originalName}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-weight: ${group.customers.length > 1 ? 'bold' : 'normal'};" />
                                                    ${group.customers.length > 1 ? `
                                                        <span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block;">
                                                            ${group.customers.length} شرائح
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                                                    ${packagesArray.map(pkg => `
                                                        <div style="background: linear-gradient(135deg, #e3e3e3, #d1d1d1); padding: 3px 6px; border-radius: 8px; border-right: 2px solid #6f42c1;">
                                                            <span style="color: #333; font-size: 10px; font-weight: 600;">${pkg}</span>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${group.customers.map(customer => {
                                const packagePrice = parseFloat(customer.package_price || 0) || 0;

                                // إنشاء input باستخدام DOM API بدلاً من template string
                                const input = document.createElement('input');
                                input.type = 'number';
                                input.dataset.id = customer.id;
                                input.dataset.field = 'package_price';
                                input.className = 'table-input';
                                input.value = packagePrice;
                                input.setAttribute('value', packagePrice);
                                input.style.cssText = `
                                                            width: 100% !important;
                                                            padding: 0.3rem !important;
                                                            border: 1px solid #ddd !important;
                                                            border-radius: 4px !important;
                                                            font-size: 0.9rem !important;
                                                            color: #000 !important;
                                                            background: #fff !important;
                                                        `;
                                input.placeholder = 'سعر الباقة';
                                input.setAttribute('oninput', 'updateRowTotal(this)');

                                const finalHTML = input.outerHTML;

                                console.log(`🔍 FINAL HTML - Customer ${customer.id}:`, {
                                    html: finalHTML,
                                    valueAttribute: finalHTML.includes(`value="${packagePrice}"`) ? 'FOUND' : 'NOT FOUND',
                                    shows60: finalHTML.includes('value="60"')
                                });

                                return finalHTML;
                            }).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${group.customers.map(customer => {
                                const debtAmount = parseFloat(customer.debt_amount || 0) || 0;
                                return `
                                                            <input type="number" data-id="${customer.id}" data-field="debt_amount" class="table-input" value="${debtAmount}" 
                                                                style="width: 100% !important; padding: 0.3rem !important; border: 1px solid #ddd !important; border-radius: 4px !important; font-size: 0.9rem !important; color: #000 !important; background: #fff !important;" 
                                                                placeholder="المبلغ المتأخر" oninput="updateRowTotal(this)" />
                                                        `;
                            }).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${phonesArray.map(phone => {
                                // Clean up phone number: remove all non-digits
                                let cleanedPhone = phone.replace(/\D/g, '');

                                // For Egyptian numbers starting with +1, keep them as is
                                if (cleanedPhone.startsWith('1')) {
                                    // Egyptian number with +1 format, keep as is
                                    cleanedPhone = cleanedPhone;
                                }
                                // If number starts with 0, replace it with 20 for Egypt
                                else if (cleanedPhone.startsWith('0')) {
                                    cleanedPhone = '20' + cleanedPhone.substring(1);
                                }
                                // If number doesn't start with 20, prepend 20
                                else if (!cleanedPhone.startsWith('20')) {
                                    cleanedPhone = '20' + cleanedPhone;
                                }

                                return `
                                                        <div style="display: flex; align-items: center; gap: 0.5rem; background: #f8f9fa; padding: 0.3rem 0.5rem; border-radius: 4px; border-right: 2px solid var(--info-color); cursor: pointer;" onclick="window.open('https://api.whatsapp.com/send/?phone=${cleanedPhone}&text&type=phone_number&app_absent=0', '_blank')">
                                                            <input data-id="${group.ids[0]}" data-field="phone" class="table-input" value="${phone}" style="flex: 1; padding: 0.3rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; background: transparent; pointer-events: none;" />
                                                            <span style="color: #25d366; font-size: 0.8rem; font-weight: 600;">📱</span>
                                                        </div>
                                                      `;
                            }).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${addressesArray.map(address => `
                                                        <input data-id="${group.ids[0]}" data-field="address" class="table-input" value="${address}" style="width: 100%; padding: 0.3rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;" />
                                                    `).join('')}
                                                </div>
                                            </td>
                                             <td style="padding: 1rem;">
                                                 <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                     <input data-id="${group.ids.join(',')}" type="number" step="0.01" class="table-total" value="${group.totalAmount.toFixed(2)}" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-weight: bold; background: #f8f9fa;" readonly />
                                                    <!-- DEBUG: totalAmount=${group.totalAmount}, fixed=${group.totalAmount.toFixed(2)}, type=${typeof group.totalAmount} -->
                                                    <!-- TEST: Raw value test = ${group.totalAmount} -->
                                                    <small style="color: #666; font-size: 0.8rem;">إجمالي ${group.customers.length} شرائح</small>
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                                    <select data-id="${group.ids[0]}" data-field="collection_status" class="table-select" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                                                        <option ${isCollected ? "selected" : ""}>تم التحصيل</option>
                                                        <option ${!isCollected ? "selected" : ""}>لم يتم التحصيل</option>
                                                    </select>
                                                    ${group.customers.length > 1 ? `
                                                        <div style="font-size: 0.8rem; color: #666;">
                                                            ✅ ${group.collectedCount} | ⏳ ${group.pendingCount}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                                    <div style="display: flex; gap: 0.5rem;">
                                                        <button onclick="saveGroupedCustomer('${group.ids.join(',')}', this)" class="btn btn-sm btn-primary" style="padding: 0.5rem 1rem;">💾</button>
                                                        <button onclick="deleteGroupedCustomer('${group.ids.join(',')}', this)" class="btn btn-sm btn-danger" style="padding: 0.5rem 1rem;">🗑️</button>
                                                    </div>
                                                    ${group.customers.length > 1 ? `
                                                        <button onclick="expandGroupedCustomersAdmin('${group.ids.join(',')}', '${group.originalName}')" class="btn btn-sm btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">📋 تفاصيل</button>
                                                    ` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                        }
                    )
                    .join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        console.log("🎉 All sections rendered. Total blocks:", Object.keys(grouped).length);
    }

    // Filter customers
    function filterCustomers() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedSection = sectionFilter.value;

        let filtered = [...currentCustomers];

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                c.phone.includes(searchTerm)
            );
        }

        if (selectedSection) {
            filtered = filtered.filter(c => c.section === selectedSection);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">🔍</div><h3>لا توجد نتائج</h3><p>جرب تغيير معايير البحث</p></div>';
        } else {
            window.renderCustomersBySection(filtered, container);
        }
    }

    // Global functions
    window.saveCustomer = async (id, btn) => {
        const row = btn.closest("tr");
        const inputs = row.querySelectorAll("[data-field]");
        const updated = {};

        // Collect and validate data
        inputs.forEach((inp) => {
            const fieldName = inp.dataset.field;
            let value = inp.value.trim();

            // Skip debt_amount updates for grouped customers (readonly field showing total)
            if (fieldName === 'debt_amount' && inp.dataset.id.includes(',')) {
                return;
            }

            // Skip empty values for non-essential fields
            if (!value && fieldName !== 'name' && fieldName !== 'debt_amount') {
                return;
            }

            // Convert data types
            if (fieldName === "debt_amount") {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                    console.warn(`Invalid debt_amount value: ${value}`);
                    return;
                }
                updated[fieldName] = numValue;
            } else if (value) {
                updated[fieldName] = value;
            }
        });

        if (Object.keys(updated).length === 0) {
            btn.innerHTML = "⚠️";
            setTimeout(() => (btn.innerHTML = "💾"), 2000);
            return;
        }

        try {
            // الحصول على البيانات الأصلية للعميل
            const { data: originalCustomer, error: fetchError } = await supabaseClient
                .from("customers")
                .select("*")
                .eq("id", id)
                .single();

            if (fetchError) {
                console.error('Error fetching original customer data:', fetchError);
            }

            const isNewlyCollected = updated.collection_status === 'تم التحصيل'
                && originalCustomer?.collection_status !== 'تم التحصيل';

            // إذا تم تغيير الحالة إلى "تم التحصيل"، صفّر الديون وأبقِ سعر الباقة
            if (isNewlyCollected && originalCustomer) {
                updated.debt_amount = 0;
                updated.due_amount = 0;
                updated.package_price = originalCustomer.package_price;
            }

            const { error } = await supabaseClient
                .from("customers")
                .update(updated)
                .eq("id", id);

            if (error) {
                console.error('Error updating customer:', error);
                btn.innerHTML = "❌";
                setTimeout(() => (btn.innerHTML = "💾"), 2000);
                alert('حدث خطأ أثناء تحديث العميل: ' + error.message);
                return;
            }

            // تسجيل عملية التحصيل في جدول collections إذا تغيرت الحالة للمحصل
            if (isNewlyCollected && originalCustomer) {
                const collectedAmount = calculateAmount(originalCustomer);
                const periodLabel = new Date().toISOString().slice(0, 7); // e.g. "2026-02"
                const adminId = localStorage.getItem('agent_id') || sessionStorage.getItem('agent_id');
                await supabaseClient.from("collections").insert([{
                    customer_id: id,
                    collected_by: adminId || originalCustomer.agent_id,
                    amount: collectedAmount,
                    package_price: parseFloat(originalCustomer.package_price || 0),
                    period_label: periodLabel
                }]);
                console.log(`✅ Collection record created for customer ${id}, amount: ${collectedAmount}`);
            }

            btn.innerHTML = "✅";
            setTimeout(() => (btn.innerHTML = "💾"), 1000);

            // إعادة تحميل البيانات بعد الحفظ
            setTimeout(() => window.loadCustomersByAgent(document.getElementById("sectionsContainer")), 500);

        } catch (error) {
            console.error('Error in saveCustomer:', error);
            btn.innerHTML = "❌";
            setTimeout(() => (btn.innerHTML = "💾"), 2000);
            alert('حدث خطأ غير متوقع: ' + error.message);
        }
    };

    window.deleteCustomer = async (id, btn) => {
        if (!confirm("❌ هل تريد حذف هذا العميل؟")) return;

        try {
            // First delete related collections
            const { error: collectionsError } = await supabaseClient
                .from("collections")
                .delete()
                .eq("customer_id", id);

            if (collectionsError) {
                console.error("Error deleting collections:", collectionsError);
                alert("❌ خطأ في حذف سجلات التحصيل: " + collectionsError.message);
                return;
            }

            // Then delete related stop requests
            const { error: stopRequestsError } = await supabaseClient
                .from("stop_requests")
                .delete()
                .eq("customer_id", id);

            if (stopRequestsError) {
                console.error("Error deleting stop requests:", stopRequestsError);
                alert("❌ خطأ في حذف طلبات الإيقاف: " + stopRequestsError.message);
                return;
            }

            // Finally delete the customer
            const { error: customerError } = await supabaseClient
                .from("customers")
                .delete()
                .eq("id", id);

            if (customerError) {
                console.error("Error deleting customer:", customerError);
                alert("❌ خطأ في حذف العميل: " + customerError.message);
                return;
            }

            await loadCustomersByAgent();
        } catch (error) {
            console.error("Unexpected error in deleteCustomer:", error);
            alert("❌ حدث خطأ غير متوقع: " + error.message);
        }
    };

    window.addCustomer = async (section) => {
        const name = prompt("اسم العميل:");
        if (!name) return;

        const phone = prompt("رقم الهاتف:") || "";
        const address = prompt("العنوان:") || "";
        const debt_amount = prompt("المبلغ:", "0");

        await supabaseClient.from("customers").insert({
            name,
            phone,
            address,
            debt_amount: Number(debt_amount),
            section,
            agent_id,
            billing_month: new Date().toISOString().slice(0, 7),
            collection_status: "لم يتم التحصيل",
        });

        await loadCustomersByAgent();
    };

    window.clearAllCustomers = async () => {
        const agentSelect = document.getElementById("adminAgentSelect");
        const selectedAgentId = agentSelect?.value;

        if (!selectedAgentId) {
            alert("⚠️ الرجاء اختيار مندوب أولاً");
            return;
        }

        if (!confirm("⚠️ هل تريد حذف كل عملاء المندوب المحدد؟")) return;

        try {
            // First get customers of selected agent to delete their related data
            const { data: agentCustomers, error: fetchError } = await supabaseClient
                .from("customers")
                .select("id")
                .eq("agent_id", selectedAgentId);

            if (fetchError) {
                console.error("Error fetching agent customers:", fetchError);
                alert("❌ خطأ في جلب بيانات العملاء: " + fetchError.message);
                return;
            }

            if (!agentCustomers || agentCustomers.length === 0) {
                alert("📭 لا يوجد عملاء لهذا المندوب");
                return;
            }

            const customerIds = agentCustomers.map(c => c.id);

            // First delete collections for these customers
            const { error: collectionsError } = await supabaseClient
                .from("collections")
                .delete()
                .in("customer_id", customerIds);

            if (collectionsError) {
                console.error("Error deleting collections:", collectionsError);
                alert("❌ خطأ في حذف سجلات التحصيل: " + collectionsError.message);
                return;
            }

            // Then delete stop requests for these customers
            const { error: stopRequestsError } = await supabaseClient
                .from("stop_requests")
                .delete()
                .in("customer_id", customerIds);

            if (stopRequestsError) {
                console.error("Error deleting stop requests:", stopRequestsError);
                alert("❌ خطأ في حذف طلبات الإيقاف: " + stopRequestsError.message);
                return;
            }

            // Finally delete customers of selected agent
            const { error: customersError } = await supabaseClient
                .from("customers")
                .delete()
                .eq("agent_id", selectedAgentId);

            if (customersError) {
                console.error("Error deleting customers:", customersError);
                alert("❌ خطأ في حذف العملاء: " + customersError.message);
                return;
            }

            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">📭</div><h3>تم حذف جميع عملاء المندوب</h3></div>';
            window.updateQuickStats([]);
        } catch (error) {
            console.error("Unexpected error in clearAllCustomers:", error);
            alert("❌ حدث خطأ غير متوقع: " + error.message);
        }
    };

    // دوال التعامل مع العملاء المجموعين
    window.saveGroupedCustomer = async (customerIds, btn) => {
        const ids = customerIds.split(',');
        const row = btn.closest("tr");
        const inputs = row.querySelectorAll("[data-field]");
        const updated = {};

        // Collect and validate data
        inputs.forEach((inp) => {
            const fieldName = inp.dataset.field;
            let value = inp.value.trim();

            // Skip debt_amount updates for grouped customers (readonly field showing total)
            if (fieldName === 'debt_amount' && ids.length > 1) {
                console.log('Skipping debt_amount update for grouped customers');
                return;
            }

            // Skip empty values for non-essential fields
            if (!value && fieldName !== 'name' && fieldName !== 'debt_amount') {
                return;
            }

            // Convert data types
            if (fieldName === "debt_amount") {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                    console.warn(`Invalid debt_amount value: ${value}`);
                    return;
                }
                updated[fieldName] = numValue;
            } else if (value) {
                updated[fieldName] = value;
            }
        });

        if (Object.keys(updated).length === 0) {
            btn.innerHTML = "⚠️";
            setTimeout(() => (btn.innerHTML = "💾"), 2000);
            return;
        }

        try {
            // Find the group data from current customers
            const allCustomers = window.currentCustomers || [];
            const groupCustomers = allCustomers.filter(c => ids.includes(c.id.trim()));

            if (groupCustomers.length === 0) {
                btn.innerHTML = "⚠️";
                setTimeout(() => (btn.innerHTML = "💾"), 2000);
                return;
            }

            const group = {
                customers: groupCustomers,
                originalName: groupCustomers[0]?.name || 'غير معروف'
            };

            // تحديث كل عميل في المجموعة
            const collectionsToInsert = [];
            const periodLabel = new Date().toISOString().slice(0, 7);
            const adminId = localStorage.getItem('agent_id') || sessionStorage.getItem('agent_id');

            const updatePromises = ids.map(id => {
                const trimmedId = id.trim();
                if (!trimmedId) return Promise.resolve({ error: null });

                const originalCustomer = group.customers.find(c => c.id === trimmedId);
                if (!originalCustomer) return Promise.resolve({ error: null });

                let customerUpdate = {
                    name: updated.name || originalCustomer.name,
                    phone: updated.phone || originalCustomer.phone,
                    address: updated.address || originalCustomer.address,
                    debt_amount: updated.debt_amount !== undefined ? updated.debt_amount : originalCustomer.debt_amount,
                    due_amount: originalCustomer.due_amount, // Preservation
                    section: updated.section || originalCustomer.section,
                    collection_status: updated.collection_status || originalCustomer.collection_status
                };

                // سعر الباقة - استخدم قيمة هذا العميل تحديداً
                const packageInput = row.querySelector(`[data-id="${trimmedId}"][data-field="package_price"]`);
                customerUpdate.package_price = packageInput
                    ? parseFloat(packageInput.value) || originalCustomer.package_price
                    : originalCustomer.package_price;

                // المبلغ المتأخر - استخدم قيمة هذا العميل تحديداً
                const debtInput = row.querySelector(`[data-id="${trimmedId}"][data-field="debt_amount"]`);
                customerUpdate.debt_amount = debtInput
                    ? parseFloat(debtInput.value) || 0
                    : (updated.debt_amount !== undefined ? updated.debt_amount : originalCustomer.debt_amount);

                const isNewlyCollected = customerUpdate.collection_status === 'تم التحصيل'
                    && originalCustomer.collection_status !== 'تم التحصيل';

                // عند التحصيل: صفّر الديون وأبقِ سعر الباقة
                if (isNewlyCollected) {
                    customerUpdate.debt_amount = 0;
                    customerUpdate.due_amount = 0;
                    customerUpdate.package_price = originalCustomer.package_price;

                    // أضف سجل تحصيل
                    collectionsToInsert.push({
                        customer_id: trimmedId,
                        collected_by: adminId || originalCustomer.agent_id,
                        amount: calculateAmount(originalCustomer),
                        package_price: parseFloat(originalCustomer.package_price || 0),
                        period_label: periodLabel
                    });
                }

                return supabaseClient.from("customers").update(customerUpdate).eq("id", trimmedId);
            });

            const results = await Promise.all(updatePromises);
            const errors = results.filter(result => result.error);
            if (errors.length > 0) {
                const errorMessages = errors.map(e => e.error?.message || 'Unknown error').join(', ');
                btn.innerHTML = "❌";
                setTimeout(() => (btn.innerHTML = "💾"), 2000);
                alert(`حدث خطأ أثناء تحديث بعض العملاء: ${errorMessages}`);
                return;
            }

            // تسجيل التحصيلات الجديدة
            if (collectionsToInsert.length > 0) {
                await supabaseClient.from("collections").insert(collectionsToInsert);
                console.log(`✅ Inserted ${collectionsToInsert.length} collection records`);
            }

            btn.innerHTML = "✅";
            setTimeout(() => (btn.innerHTML = "💾"), 1000);

            // إعادة تحميل البيانات
            setTimeout(() => window.loadCustomersByAgent(document.getElementById("sectionsContainer")), 500);

        } catch (error) {
            console.error('Error in saveGroupedCustomer:', error);
            btn.innerHTML = "❌";
            setTimeout(() => (btn.innerHTML = "💾"), 2000);
            alert('حدث خطأ غير متوقع: ' + error.message);
        }
    };

    window.deleteGroupedCustomer = async (customerIds, btn) => {
        const ids = customerIds.split(',');
        const customerCount = ids.length;

        if (!confirm(`❌ هل تريد حذف هؤلاء الـ ${customerCount} عملاء؟`)) return;

        try {
            // First delete related collections for all customers
            const { error: collectionsError } = await supabaseClient
                .from("collections")
                .delete()
                .in("customer_id", ids.map(id => id.trim()));

            if (collectionsError) {
                console.error("Error deleting collections:", collectionsError);
                alert("❌ خطأ في حذف سجلات التحصيل: " + collectionsError.message);
                return;
            }

            // Then delete related stop requests for all customers
            const { error: stopRequestsError } = await supabaseClient
                .from("stop_requests")
                .delete()
                .in("customer_id", ids.map(id => id.trim()));

            if (stopRequestsError) {
                console.error("Error deleting stop requests:", stopRequestsError);
                alert("❌ خطأ في حذف طلبات الإيقاف: " + stopRequestsError.message);
                return;
            }

            // Finally delete all customers
            const { error: customerError } = await supabaseClient
                .from("customers")
                .delete()
                .in("id", ids.map(id => id.trim()));

            if (customerError) {
                console.error("Error deleting customers:", customerError);
                alert("❌ خطأ في حذف العملاء: " + customerError.message);
                return;
            }

            await loadCustomersByAgent();
        } catch (error) {
            console.error("Unexpected error in deleteGroupedCustomer:", error);
            alert("❌ حدث خطأ غير متوقع: " + error.message);
        }
    };

    window.expandGroupedCustomersAdmin = function (customerIds, customerName) {
        const ids = customerIds.split(',');
        const customers = window.currentCustomers.filter(c => ids.includes(c.id.toString()));

        console.log("🔍 expandGroupedCustomersAdmin called with:", { customerIds, customerName, customersFound: customers.length });

        // Get collections for correct amounts
        const supabaseClient = window.supabaseClient;
        let collectionAmounts = {};

        // Try to get collections data for correct amounts
        if (supabaseClient && customers.length > 0) {
            const customerIds = customers.map(c => c.id);
            supabaseClient
                .from('collections')
                .select('*')
                .in('customer_id', customerIds)
                .then(({ data: collections }) => {
                    collections?.forEach(collection => {
                        if (collection.customer_id) {
                            const amount = collection.amount || collection.original_amount || collection.debt_amount || 0;
                            collectionAmounts[collection.customer_id] = parseFloat(amount) || 0;
                        }
                    });
                })
                .catch(error => {
                    console.warn('⚠️ Could not load collections for amounts:', error);
                });
        }

        // Process customers with correct amount calculation (same logic as main display)
        const processedCustomers = customers.map(customer => {
            // For collected customers, amount should be 0
            // For non-collected customers, amount = package_price + debt_amount
            const packagePrice = parseFloat(customer.package_price || 0) || 0;
            const existingDebt = parseFloat(customer.debt_amount || 0) || 0;

            const amount = customer.collection_status === 'تم التحصيل'
                ? 0  // Collected customers have 0 due amount
                : calculateAmount(customer);  // Non-collected customers owe the full computed amount

            console.log(`🔍 Processing customer ${customer.id}:`, {
                name: customer.name,
                collection_status: customer.collection_status,
                package_price: packagePrice,
                original_debt_amount: existingDebt,
                calculated_amount: amount
            });

            return {
                ...customer,
                debt_amount: parseFloat(amount) || 0
            };
        });

        console.log("🔍 Processed customers:", processedCustomers);

        // Calculate total amount using the processed debt_amount (already calculated correctly)
        const totalAmount = processedCustomers.reduce((sum, c) => sum + calculateAmount(c), 0);

        let modalHTML = `
            <div id="adminGroupedModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 999999;">
                <div style="background: white; border-radius: 15px; padding: 30px; max-width: 900px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef;">
                        <h2 style="margin: 0; color: #667eea;">تفاصيل الشرائح للعميل: ${customerName}</h2>
                        <button onclick="closeAdminGroupedModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d; padding: 5px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" onmouseover="this.style.background='#f8f9fa'; this.style.color='#dc3545';" onmouseout="this.style.background='none'; this.style.color='#6c757d';">×</button>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #d4edda, #c3e6cb); border-radius: 10px;">
                        <h4 style="color: #155724; margin: 0 0 10px 0;">ملخص إجمالي للعميل</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div><strong>عدد الشرائح:</strong> ${processedCustomers.length}</div>
                            <div><strong>إجمالي المبلغ:</strong> ${totalAmount.toFixed(2)} ج.م</div>
                            <div><strong>تم التحصيل:</strong> ${processedCustomers.filter(c => c.collection_status === "تم التحصيل").length}</div>
                            <div><strong>لم يتم:</strong> ${processedCustomers.filter(c => c.collection_status !== "تم التحصيل").length}</div>
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">م</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">الشريحة/الباقة</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">الهاتف</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">العنوان</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">المبلغ</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">الحالة</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${processedCustomers.map((customer, index) => {
            const amount = parseFloat(customer.debt_amount || 0) || 0;
            const servicePackage = customer.package || customer.package_name || customer.service_type || 'شريحة أساسية';
            return `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 12px; text-align: center; font-weight: bold;">${index + 1}</td>
                                            <td style="padding: 12px;">
                                                <div style="background: linear-gradient(135deg, #e3e3e3, #d1d1d1); padding: 4px 8px; border-radius: 8px; border-right: 2px solid #6f42c1;">
                                                    <span style="color: #333; font-size: 11px; font-weight: 600;">${servicePackage}</span>
                                                </div>
                                            </td>
                                            <td style="padding: 12px;">
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span>${customer.phone}</span>
                                                    <button onclick="window.open('https://wa.me/${(customer.phone || '').replace(/\D/g, '')}', '_blank')" style="background: #25d366; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">📱</button>
                                                </div>
                                            </td>
                                            <td style="padding: 12px;">${customer.address}</td>
                                            <td style="padding: 12px; font-weight: bold; color: #28a745;">${calculateAmount(customer).toFixed(2)} ج.م</td>
                                            <td style="padding: 12px;">
                                                <span style="background: ${customer.collection_status === "تم التحصيل" ? "#28a745" : "#ffc107"}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                                                    ${customer.collection_status}
                                                </span>
                                            </td>
                                            <td style="padding: 12px;">
                                                <div style="display: flex; gap: 5px;">
                                                    <button onclick="saveCustomer('${customer.id}', this)" class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 11px;">💾</button>
                                                    <button onclick="deleteCustomer('${customer.id}', this)" class="btn btn-sm btn-danger" style="padding: 4px 8px; font-size: 11px;">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // إزالة أي مودال موجود
        const existingModal = document.getElementById('adminGroupedModal');
        if (existingModal) {
            existingModal.remove();
        }

        // إضافة المودال الجديد
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        console.log("🔍 Modal HTML added to page");
        console.log("🔍 Processed customers count:", processedCustomers.length);
        console.log("🔍 Modal HTML length:", modalHTML.length);
    };

    window.closeAdminGroupedModal = function () {
        const modal = document.getElementById('adminGroupedModal');
        if (modal) {
            modal.remove();
        }
    };

    window.exportToExcel = () => {
        if (!currentCustomers.length) return alert("لا توجد بيانات للتصدير");

        // تحضير البيانات مع الأعمدة الإضافية
        const excelData = currentCustomers.map(customer => {
            const collectionInfo = (window.currentCollectionData && window.currentCollectionData[customer.id]) || { amount: 0, date: '-' };

            return {
                'اسم العميل': customer.name || "",
                'رقم الهاتف': customer.phone || "",
                'العنوان': customer.address || "",
                'القسم': customer.section || "",
                'المندوب': customer.agent_name || "غير محدد",
                'المبلغ المستحق': calculateAmount(customer) || 0,
                'المبلغ المحصل': collectionInfo.amount,
                'حالة الدفع': customer.collection_status || "لم يتم التحصيل",
                'تاريخ التحصيل': collectionInfo.date,
                'ملاحظات': customer.notes || "",
                'تاريخ الإضافة': customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-SA') : ""
            };
        });

        // إنشاء ورقة العمل
        const ws = XLSX.utils.json_to_sheet(excelData);

        // تعديل عرض الأعمدة
        const colWidths = [
            { wch: 20 }, // اسم العميل
            { wch: 15 }, // رقم الهاتف
            { wch: 25 }, // العنوان
            { wch: 15 }, // القسم
            { wch: 15 }, // المندوب
            { wch: 15 }, // المبلغ المستحق
            { wch: 15 }, // المبلغ المحصل
            { wch: 15 }, // حالة الدفع
            { wch: 15 }, // تاريخ التحصيل
            { wch: 30 }, // ملاحظات
            { wch: 15 }  // تاريخ الإضافة
        ];
        ws['!cols'] = colWidths;

        // تطبيق التنسيق الشرطي والألوان
        applyExcelFormatting(ws, excelData);

        // إنشاء مصنف جديد
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "تحصيل المندوب");

        // إضافة ورقة ثانية للإحصائيات
        const statsData = generateCollectionStats(currentCustomers);
        const statsWs = XLSX.utils.json_to_sheet(statsData);
        statsWs['!cols'] = [
            { wch: 20 }, // الوصف
            { wch: 15 }, // القيمة
            { wch: 30 }  // ملاحظات
        ];
        XLSX.utils.book_append_sheet(wb, statsWs, "إحصائيات التحصيل");

        // حفظ الملف باسم مخصص
        const fileName = `تحصيل_المندوب_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);

        // رسالة تأكيد
        alert(`✅ تم تصدير ${currentCustomers.length} عميل بنجاح!\n\n📊 يحتوي الملف على:\n• ورقة بيانات العملاء مع تنسيق الألوان\n• ورقة إحصائيات التحصيل\n\n🎨 الألوان المستخدمة:\n• 🟢 أخضر: تم التحصيل\n• 🔴 أحمر: لم يتم التحصيل\n• 🟡 أصفر: تحصيل جزئي`);
    };

    // دالة تطبيق التنسيق الشرطي والألوان
    window.applyExcelFormatting = function (ws, data) {
        const range = XLSX.utils.decode_range(ws['!ref']);

        // تنسيق رأس الجدول (الصف الأول)
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellAddress]) ws[cellAddress] = {};
            ws[cellAddress].s = {
                font: { bold: true },
                fill: { bgColor: { rgb: "1F497D" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        // تنسيق البيانات حسب حالة الدفع
        for (let row = 1; row <= range.e.r; row++) {
            const paymentStatusCell = XLSX.utils.encode_cell({ r: row, c: 6 }); // عمود حالة الدفع
            const amountCell = XLSX.utils.encode_cell({ r: row, c: 5 }); // عمود المبلغ

            if (ws[paymentStatusCell] && ws[paymentStatusCell].v) {
                const status = ws[paymentStatusCell].v.toString().toLowerCase();
                let bgColor, fontColor;

                switch (status) {
                    case 'تم التحصيل':
                        bgColor = "C6EFCE"; // أخضر فاتح
                        fontColor = "006100"; // أخضر غامق
                        break;
                    case 'لم يتم التحصيل':
                        bgColor = "FFC7CE"; // أحمر فاتح
                        fontColor = "9C0006"; // أحمر غامق
                        break;
                    case 'تحصيل جزئي':
                        bgColor = "FFEB9C"; // أصفر فاتح
                        fontColor = "9C6500"; // برتقالي غامق
                        break;
                    default:
                        bgColor = "F2F2F2"; // رمادي فاتح
                        fontColor = "000000"; // أسود
                }

                // تطبيق اللون على صف كامل
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!ws[cellAddress]) ws[cellAddress] = {};
                    ws[cellAddress].s = {
                        fill: { bgColor: { rgb: bgColor } },
                        font: { color: { rgb: fontColor } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }

                // تنسيق خاص لعمود المبلغ
                if (ws[amountCell]) {
                    ws[amountCell].s = {
                        ...ws[amountCell].s,
                        font: { bold: true, color: { rgb: fontColor } },
                        numFmt: "#,##0.00 \"ج.م\""
                    };
                }
            }
        }

        // تنسيق أعمدة محددة
        for (let row = 1; row <= range.e.r; row++) {
            // تنسيق عمود المبلغ المستحق
            const amountCell = XLSX.utils.encode_cell({ r: row, c: 5 });
            if (ws[amountCell] && !ws[amountCell].s) {
                ws[amountCell].s = {
                    font: { bold: true },
                    numFmt: "#,##0.00 \"ج.م\"",
                    alignment: { horizontal: "center" }
                };
            }

            // تنسيق عمود التاريخ
            const dateCell = XLSX.utils.encode_cell({ r: row, c: 7 });
            if (ws[dateCell] && ws[dateCell].v) {
                ws[dateCell].s = {
                    alignment: { horizontal: "center" },
                    numFmt: "yyyy-mm-dd"
                };
            }

            // تنسيق عمود تاريخ الإضافة
            const createdDateCell = XLSX.utils.encode_cell({ r: row, c: 9 });
            if (ws[createdDateCell] && ws[createdDateCell].v) {
                ws[createdDateCell].s = {
                    alignment: { horizontal: "center" },
                    numFmt: "dd/mm/yyyy"
                };
            }
        }
    }

    // دالة مساعدة لإنشاء إحصائيات التحصيل
    window.generateCollectionStats = function (customers) {
        const total = customers.length;
        const collected = customers.filter(c => c.collection_status === 'تم التحصيل').length;
        const pending = customers.filter(c => c.collection_status === 'لم يتم التحصيل').length;
        const partial = customers.filter(c => c.collection_status === 'تحصيل جزئي').length;
        const totalAmount = customers.reduce((sum, c) => sum + calculateAmount(c), 0);
        const collectedAmount = customers
            .filter(c => c.collection_status === 'تم التحصيل')
            .reduce((sum, c) => sum + calculateAmount(c), 0);

        return [
            { 'الإحصائية': 'إجمالي العملاء', 'القيمة': total, 'ملاحظات': 'عدد كل العملاء في القائمة' },
            { 'الإحصائية': 'تم التحصيل', 'القيمة': collected, 'ملاحظات': 'عملاء تم تحصيل المبلغ منهم بالكامل' },
            { 'الإحصائية': 'لم يتم التحصيل', 'القيمة': pending, 'ملاحظات': 'عملاء لم يتم تحصيل أي مبلغ منهم' },
            { 'الإحصائية': 'تحصيل جزئي', 'القيمة': partial, 'ملاحظات': 'عملاء تم تحصيل جزء من المبلغ منهم' },
            { 'الإحصائية': 'نسبة التحصيل', 'القيمة': `${((collected / total) * 100).toFixed(1)}%`, 'ملاحظات': 'نسبة العملاء الذين تم تحصيل المبلغ منهم' },
            { 'الإحصائية': 'إجمالي المبلغ', 'القيمة': totalAmount.toFixed(2), 'ملاحظات': 'مجموع المبالغ المستحقة بالجنية' },
            { 'الإحصائية': 'المبلغ المحصل', 'القيمة': collectedAmount.toFixed(2), 'ملاحظات': 'المبلغ الذي تم تحصيله بالفعل' },
            { 'الإحصائية': 'المبلغ المتبقي', 'القيمة': (totalAmount - collectedAmount).toFixed(2), 'ملاحظات': 'المبلغ المتبقي للتحصيل' }
        ];
    }

    console.log('✅ Management functionality initialized!');
}

// Load Admin Content
async function loadAdminContent(container) {
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">👤 إدارة المناديب</h2>
            <p style="color: #666;">إضافة وتعديل وحذف المناديب</p>
        </div>
        
        <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h3>قائمة المناديب</h3>
                <button onclick="showAddAgentForm()" class="btn btn-primary">
                    <span>➕ إضافة مندوب جديد</span>
                </button>
            </div>
            
            <div id="agentsListContainer">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
        
        <!-- Add Agent Modal -->
        <div id="addAgentModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; padding: 2rem;">
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; margin: 0 auto; margin-top: 5rem;">
                <h3 style="margin-bottom: 1.5rem;">إضافة مندوب جديد</h3>
                <form id="addAgentForm">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label class="form-label">الاسم</label>
                        <input type="text" name="name" class="form-control" autocomplete="username" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label class="form-label">البريد الإلكتروني</label>
                        <input type="email" name="email" class="form-control" autocomplete="email" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label class="form-label">الهاتف</label>
                        <input type="tel" name="phone" class="form-control" autocomplete="tel">
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label class="form-label">كلمة المرور</label>
                        <input type="password" name="password" class="form-control" autocomplete="new-password" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label class="form-label">الدور</label>
                        <select name="role" class="form-control">
                            <option value="agent">مندوب</option>
                            <option value="admin">مدير</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn btn-primary">حفظ</button>
                        <button type="button" onclick="hideAddAgentForm()" class="btn btn-secondary">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await initializeAdmin();
}

async function initializeAdmin() {
    // Use global Supabase client
    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return;
    }

    await loadAgents();

    async function loadAgents() {
        const { data: agents, error } = await supabaseClient.from("agents").select("*").order("name");
        const container = document.getElementById("agentsListContainer");

        if (error) {
            container.innerHTML = `<div style="color: red;">خطأ: ${error.message}</div>`;
            return;
        }

        if (!agents.length) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">لا يوجد مناديب</div>';
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الاسم</th>
                            <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">البريد الإلكتروني</th>
                            <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الهاتف</th>
                            <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الدور</th>
                            <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${agents.map(agent => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 1rem;">${agent.name}</td>
                                <td style="padding: 1rem;">${agent.email}</td>
                                <td style="padding: 1rem;">${agent.phone || '-'}</td>
                                <td style="padding: 1rem;">
                                    <span style="background: ${agent.role === 'admin' ? '#ff6b35' : '#4caf50'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">
                                        ${agent.role === 'admin' ? 'مدير' : 'مندوب'}
                                    </span>
                                </td>
                                <td style="padding: 1rem;">
                                    <button onclick="deleteAgent('${agent.id}')" class="btn btn-sm btn-danger">🗑️ حذف</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    window.showAddAgentForm = () => {
        document.getElementById('addAgentModal').style.display = 'block';
    };

    window.hideAddAgentForm = () => {
        document.getElementById('addAgentModal').style.display = 'none';
    };

    window.deleteAgent = async (id) => {
        if (!confirm('هل تريد حذف هذا المندوب؟')) return;
        await supabaseClient.from('agents').delete().eq('id', id);
        await loadAgents();
    };

    document.getElementById('addAgentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const agentData = Object.fromEntries(formData);

        await supabaseClient.from('agents').insert(agentData);
        hideAddAgentForm();
        await loadAgents();
    });
}

// Load Performance Content
async function loadPerformanceContent(container) {
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">📊 أداء المناديب</h2>
            <p style="color: #666;">عرض إحصائيات وتقارير أداء المناديب</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">اختر المندوب:</label>
            <select id="performanceAgentSelect" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; width: 300px;">
                <option value="">اختر المندوب</option>
            </select>
            <button onclick="showAgentCollectionSheet()" class="btn btn-primary" style="background: #ff6b35; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; margin-right: 1rem;">
                <span>📋 شيت تحصيل المندوب</span>
            </button>
        </div>
        
        <div id="performanceContent">
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        </div>
        
        <!-- Agent Collection Sheet Modal -->
        <div id="agentCollectionModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; padding: 2rem;">
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 1200px; margin: 0 auto; margin-top: 1rem; max-height: 85vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; position: sticky; top: 0; background: white; padding-bottom: 1rem; border-bottom: 2px solid #eee;">
                    <div>
                        <h3 style="margin: 0;">📋 شيت تحصيل المندوب</h3>
                        <p id="selectedAgentName" style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;"></p>
                    </div>
                    <button onclick="hideAgentCollectionModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✖️</button>
                </div>
                <div id="agentCollectionContent">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load agents for performance
    await loadPerformanceAgents();

    await initializePerformance();
}

async function loadPerformanceAgents() {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) return;

    try {
        const { data: agents, error } = await supabaseClient
            .from("agents")
            .select("id, name")
            .order("name");

        if (error) return;

        const select = document.getElementById("performanceAgentSelect");
        agents.forEach(agent => {
            const option = document.createElement("option");
            option.value = agent.id;
            option.textContent = agent.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading performance agents:", error);
    }
}

// Global functions for agent collection modal
window.showAgentCollectionSheet = async () => {
    const agentSelect = document.getElementById('performanceAgentSelect');
    const selectedAgentId = agentSelect.value;

    if (!selectedAgentId) {
        alert('يرجى اختيار مندوب أولاً');
        return;
    }

    const modal = document.getElementById('agentCollectionModal');
    const content = document.getElementById('agentCollectionContent');
    const agentNameDisplay = document.getElementById('selectedAgentName');

    // Get agent name
    const selectedOption = agentSelect.options[agentSelect.selectedIndex];
    agentNameDisplay.textContent = `المندوب: ${selectedOption.textContent}`;

    modal.style.display = 'block';

    // Load agent collection details
    await loadAgentCollectionDetails(selectedAgentId, content);
};

window.hideAgentCollectionModal = () => {
    document.getElementById('agentCollectionModal').style.display = 'none';
};

window.loadAgentCollectionDetails = async (agentId, container) => {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) return;

    try {
        // Get agent details
        const { data: agent, error: agentError } = await supabaseClient
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();

        if (agentError) {
            container.innerHTML = `<div style="color: red;">خطأ في تحميل بيانات المندوب</div>`;
            return;
        }

        // Get customers for this agent
        const { data: customers, error: customersError } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('agent_id', agentId)
            .order('name');

        if (customersError) {
            container.innerHTML = `<div style="color: red;">خطأ في تحميل عملاء المندوب</div>`;
            return;
        }

        // Get collections for this agent
        const { data: collections, error: collectionsError } = await supabaseClient
            .from('collections')
            .select('*')
            .eq('collected_by', agentId)
            .order('created_at', { ascending: false });

        // Debug: Check collections data
        console.log('🔍 Collections data:', collections);
        console.log('🔍 Collections amounts:', collections?.map(c => ({
            customer_id: c.customer_id,
            amount: c.amount,
            type: typeof c.amount
        })));

        // Create a map of customer_id to collection amount
        const collectionAmounts = {};
        const collectionData = {}; // Full collection details map

        collections?.forEach(collection => {
            if (collection.customer_id) {
                // Use the same logic as collections.html - try multiple amount fields
                const amount = collection.amount || collection.original_amount || collection.debt_amount || 0;
                const parsedAmount = parseFloat(amount) || 0;

                // For calculateAmount (legacy/compatibility)
                if (collectionAmounts[collection.customer_id] === undefined) {
                    collectionAmounts[collection.customer_id] = parsedAmount;
                }

                // For detailed export (store the most recent since collections are ordered by created_at desc)
                if (!collectionData[collection.customer_id]) {
                    collectionData[collection.customer_id] = {
                        amount: parsedAmount,
                        date: collection.created_at ? new Date(collection.created_at).toLocaleDateString('ar-SA') : '-'
                    };
                }
            }
        });

        console.log('🔍 Collection details map:', collectionData);
        window.currentCollectionData = collectionData;

        console.log('🔍 Collection amounts map:', collectionAmounts);

        // Process customers with correct amount calculation for display
        const processedDisplayCustomers = customers?.map(customer => {
            return {
                ...customer,
                display_amount: calculateAmount(customer, collectionAmounts)
            };
        }) || [];

        // Calculate statistics
        const totalCustomers = processedDisplayCustomers?.length || 0;
        const collectedCustomers = processedDisplayCustomers?.filter(c => c.collection_status === 'تم التحصيل').length || 0;
        const pendingCustomers = totalCustomers - collectedCustomers;

        // Calculate statistics using original customer data and collection records
        const totalAmount = customers?.reduce((sum, c) => {
            // الإجمالي النظري = الباقة + الدين القديم (بدون اعتبار حالة التحصيل الحالية)
            const pkg = parseFloat(c.package_price || 0);
            const debt = parseFloat(c.debt_amount || 0);
            const due = parseFloat(c.due_amount || 0);
            return sum + (pkg + debt + due);
        }, 0) || 0;

        // المبلغ المحصل = مجموع المبالغ في جدول collections لهذا المندوب في الفترة الحالية (أو الإجمالي)
        const collectedAmount = collections?.reduce((sum, col) => sum + (parseFloat(col.amount) || 0), 0) || 0;

        // المبلغ المتبقي = إجمالي المطلوب حالياً من العملاء الذين لم يسددوا
        const pendingAmount = processedDisplayCustomers.reduce((sum, c) => sum + c.display_amount, 0);

        const collectionRate = totalAmount > 0 ? (collectedAmount / totalAmount * 100).toFixed(1) : 0;

        console.log(`📊 Final Amounts - Total: ${totalAmount}, Collected: ${collectedAmount}, Pending: ${pendingAmount}`);

        // Store data for filtering
        window.currentCustomersData = processedDisplayCustomers;
        window.currentCollectionAmounts = collectionAmounts;

        // Get unique sections for this agent
        const sections = [...new Set(processedDisplayCustomers.map(c => c.section || "غير محدد"))].sort();

        container.innerHTML = `
            <!-- Filter Controls -->
            <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; align-items: center;">
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button onclick="filterAgentSheet('all')" class="agent-filter-btn active" data-filter="all" style="padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; background: #007bff; color: white;">
                        📊 الكل (${totalCustomers})
                    </button>
                    <button onclick="filterAgentSheet('collected')" class="agent-filter-btn" data-filter="collected" style="padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; background: #6c757d; color: white;">
                        ✅ تم التحصيل (${collectedCustomers})
                    </button>
                    <button onclick="filterAgentSheet('pending')" class="agent-filter-btn" data-filter="pending" style="padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; background: #6c757d; color: white;">
                        ⏳ لم يتم (${pendingCustomers})
                    </button>
                </div>

                <div style="flex: 1; min-width: 200px;">
                    <select id="agentSectionFilter" onchange="filterAgentSheet()" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; width: 100%; cursor: pointer;">
                        <option value="all">📁 جميع الأقسام</option>
                        ${sections.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="exportAgentCollectionToExcel('modern')" style="padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; background: #28a745; color: white;">
                        📊 Excel (ألوان)
                    </button>
                </div>
            </div>
            
            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; text-align: center; border-right: 4px solid #007bff;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #007bff;">إجمالي العملاء</h4>
                    <div style="font-size: 2rem; font-weight: bold; color: #333;">${totalCustomers}</div>
                </div>
                <div style="background: #d4edda; padding: 1.5rem; border-radius: 12px; text-align: center; border-right: 4px solid #28a745;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #28a745;">تم التحصيل</h4>
                    <div style="font-size: 2rem; font-weight: bold; color: #28a745;">${collectedCustomers}</div>
                </div>
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 12px; text-align: center; border-right: 4px solid #ffc107;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #ffc107;">لم يتم التحصيل</h4>
                    <div style="font-size: 2rem; font-weight: bold; color: #ffc107;">${pendingCustomers}</div>
                </div>
                <div style="background: #f8d7da; padding: 1.5rem; border-radius: 12px; text-align: center; border-right: 4px solid #dc3545;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #dc3545;">نسبة التحصيل</h4>
                    <div style="font-size: 2rem; font-weight: bold; color: #dc3545;">${collectionRate}%</div>
                </div>
            </div>
            
            <!-- Financial Summary -->
            <div style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 1rem 0;">الملخص المالي</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>إجمالي المبالغ:</strong>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${totalAmount.toFixed(2)} ج.م</div>
                    </div>
                    <div>
                        <strong>المبلغ المحصل:</strong>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #28a745;">${collectedAmount.toFixed(2)} ج.م</div>
                    </div>
                    <div>
                        <strong>المبلغ المتبقي:</strong>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #dc3545;">${pendingAmount.toFixed(2)} ج.م</div>
                    </div>
                </div>
            </div>
            
            <!-- Sections Container -->
            <div id="agentSectionsContainer">
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        `;

        // No need to set currentCustomersData again as we did it above
        // window.currentCustomersData = processedDisplayCustomers;

        // Render customers by sections with grouped segments
        renderAgentCustomersBySection(processedDisplayCustomers, collectionAmounts);

    } catch (error) {
        console.error('Error loading agent collection details:', error);
        container.innerHTML = '<div style="color: red; text-align: center; padding: 2rem;">خطأ في تحميل تفاصيل التحصيل</div>';
    }
};

// Render agent customers by section (similar to management tab)
function renderAgentCustomersBySection(customers, collectionAmounts = {}) {
    console.log("🔄 Grouping agent customers by section...");

    const container = document.getElementById('agentSectionsContainer');
    if (!container) {
        console.error("❌ Agent sections container not found!");
        return;
    }

    const grouped = customers.reduce((acc, customer) => {
        const section = customer.section || "غير محدد";
        if (!acc[section]) acc[section] = [];
        acc[section].push(customer);
        return acc;
    }, {});

    console.log("📊 Grouped agent customers:", grouped);

    // Render sections
    let html = "";

    for (const [section, sectionCustomers] of Object.entries(grouped)) {
        console.log(`📁 Rendering agent section: ${section} with ${sectionCustomers.length} customers`);

        const safeId = section.replace(/[^\w\-]/g, "-");

        // Calculate statistics
        const totalCustomers = sectionCustomers.length;
        const collectedCount = sectionCustomers.filter(c => c.collection_status === "تم التحصيل").length;
        const pendingCount = sectionCustomers.filter(c => c.collection_status !== "تم التحصيل").length;

        // Debug: Log section customer amounts
        console.log(`🔍 Debug - Section "${section}" amounts:`, sectionCustomers.map(c => ({
            name: c.name,
            debt_amount: c.debt_amount,
            type: typeof c.debt_amount,
            parsed: parseFloat(c.debt_amount || 0)
        })));

        const totalAmount = sectionCustomers.reduce((sum, c) => sum + (c.display_amount || calculateAmount(c)), 0);

        const collectedAmount = sectionCustomers
            .filter(c => c.collection_status === "تم التحصيل")
            .reduce((sum, c) => sum + (parseFloat(collectionAmounts[c.id]) || calculateAmount(c, collectionAmounts)), 0);
        const pendingAmount = totalAmount - collectedAmount;

        console.log(`📊 Section "${section}" Final Amounts - Total: ${totalAmount}, Collected: ${collectedAmount}, Pending: ${pendingAmount}`);

        console.log(`📊 Agent section stats - Total: ${totalCustomers}, Collected: ${collectedCount}, Pending: ${pendingCount}`);

        // تجميع الشرائح المتعددة لنفس العميل
        const groupedCustomers = {};
        sectionCustomers.forEach(customer => {
            const name = (customer.name || '').trim().toLowerCase();
            if (!groupedCustomers[name]) {
                groupedCustomers[name] = {
                    originalName: customer.name || 'غير معروف',
                    customers: [],
                    totalAmount: 0,
                    allPhones: new Set(),
                    allAddresses: new Set(),
                    allPackages: new Set(),
                    allSections: new Set(),
                    ids: [],
                    collectedCount: 0,
                    pendingCount: 0
                };
            }
            groupedCustomers[name].customers.push(customer);
            groupedCustomers[name].ids.push(customer.id);

            // For display, use the processed display_amount
            const displayAmount = parseFloat(customer.display_amount || 0) || 0;
            groupedCustomers[name].totalAmount += displayAmount;

            console.log(`🔢 Adding to grouped customer "${customer.name}": ${displayAmount}, New total: ${groupedCustomers[name].totalAmount}`);

            const phone = customer.phone || 'غير محدد';
            if (phone && phone !== 'غير محدد') {
                groupedCustomers[name].allPhones.add(phone);
            }

            const address = customer.address || 'غير محدد';
            if (address && address !== 'غير محدد') {
                groupedCustomers[name].allAddresses.add(address);
            }

            // إضافة الباقة/الشريحة
            const servicePackage = customer.package || customer.package_name || customer.service_type || 'شريحة أساسية';
            groupedCustomers[name].allPackages.add(servicePackage);

            // إضافة القسم
            const section = customer.section || 'غير محدد';
            if (section && section !== 'غير محدد') {
                groupedCustomers[name].allSections.add(section);
            }

            if (customer.collection_status === "تم التحصيل") {
                groupedCustomers[name].collectedCount++;
            } else {
                groupedCustomers[name].pendingCount++;
            }
        });

        html += `
            <div class="section-block" style="margin-bottom: 2rem; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
                <div class="section-header" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 1.5rem;">
                    <div class="section-title" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <span>📁</span>
                        <h3 style="margin: 0; font-size: 1.2rem; flex: 1;">${section}</h3>
                        <button onclick="exportAgentSectionToExcel('${section.replace(/'/g, "\\'")}')" class="btn btn-sm btn-success" style="padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.8rem; background: #28a745; color: white;">
                            📊 تصدير القسم (Excel)
                        </button>
                    </div>
                    <div class="section-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.9rem;">
                        <div><strong>👥 إجمالي العملاء:</strong> ${totalCustomers}</div>
                        <div><strong>✅ تم التحصيل:</strong> ${collectedCount}</div>
                        <div><strong>⏳ لم يتم التحصيل:</strong> ${pendingCount}</div>
                        <div><strong>💰 إجمالي المبلغ:</strong> ${totalAmount.toFixed(2)} ج.م</div>
                        <div><strong>💵 تم تحصيله:</strong> ${collectedAmount.toFixed(2)} ج.م</div>
                        <div><strong>⏰ المتبقي:</strong> ${pendingAmount.toFixed(2)} ج.م</div>
                    </div>
                </div>
                <div class="section-content" style="padding: 1.5rem;">
                    <div style="overflow-x: auto;">
                        <table class="customers-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">اسم العميل</th>
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الشرائح</th>
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">سعر الباقة</th>
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">المبلغ المحصل</th>
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الهواتف</th>
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">العناوين</th>
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">إجمالي المبلغ المستحق</th>
                                    <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.values(groupedCustomers)
                .map(
                    (group) => {
                        const phonesArray = Array.from(group.allPhones);
                        const addressesArray = Array.from(group.allAddresses);
                        const packagesArray = Array.from(group.allPackages);
                        const sectionsArray = Array.from(group.allSections);
                        const isCollected = group.collectedCount > 0 && group.pendingCount === 0;

                        return `
                                        <tr style="border-bottom: 1px solid #eee; ${group.customers.length > 1 ? 'background: linear-gradient(90deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05));' : ''}">
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                                    <div style="font-weight: ${group.customers.length > 1 ? 'bold' : 'normal'}; color: #333;">
                                                        ${group.originalName}
                                                    </div>
                                                    ${group.customers.length > 1 ? `
                                                        <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block;">
                                                            ${group.customers.length} شرائح
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                                                    ${packagesArray.map(pkg => `
                                                        <div style="background: linear-gradient(135deg, #e3e3e3, #d1d1d1); padding: 3px 6px; border-radius: 8px; border-right: 2px solid #28a745;">
                                                            <span style="color: #333; font-size: 10px; font-weight: 600;">${pkg}</span>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${group.customers.map(customer => `
                                                        <div style="color: #333; font-size: 0.9rem; font-weight: 600;">${customer.package_price || 0} ج.م</div>
                                                    `).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${group.customers.map(customer => {
                            const collected = parseFloat(collectionAmounts[customer.id]) || 0;
                            const isPaid = customer.collection_status === 'تم التحصيل';
                            return `
                                                            <div style="color: ${isPaid ? '#28a745' : '#666'}; font-size: 0.9rem; font-weight: 600;">
                                                                ${isPaid ? collected.toFixed(2) : '0.00'} ج.م
                                                            </div>
                                                        `;
                        }).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${phonesArray.map(phone => {
                            // Clean up phone number: remove all non-digits
                            let cleanedPhone = phone.replace(/\D/g, '');

                            // For Egyptian numbers starting with +1, keep them as is
                            if (cleanedPhone.startsWith('1')) {
                                // Egyptian number with +1 format, keep as is
                                cleanedPhone = cleanedPhone;
                            }
                            // If number starts with 0, replace it with 20 for Egypt
                            else if (cleanedPhone.startsWith('0')) {
                                cleanedPhone = '20' + cleanedPhone.substring(1);
                            }
                            // If number doesn't start with 20, prepend 20
                            else if (!cleanedPhone.startsWith('20')) {
                                cleanedPhone = '20' + cleanedPhone;
                            }

                            return `
                                                        <div style="display: flex; align-items: center; gap: 0.5rem; background: #f8f9fa; padding: 0.3rem 0.5rem; border-radius: 4px; border-right: 2px solid #28a745; cursor: pointer;" onclick="window.open('https://api.whatsapp.com/send/?phone=${cleanedPhone}&text&type=phone_number&app_absent=0', '_blank')">
                                                            <span style="flex: 1; color: #333; font-size: 0.9rem;">${phone}</span>
                                                            <span style="color: #25d366; font-size: 0.8rem; font-weight: 600;">📱</span>
                                                        </div>
                                                      `;
                        }).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    ${addressesArray.map(address => `
                                                        <div style="color: #666; font-size: 0.9rem;">${address}</div>
                                                    `).join('')}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                                                    <div style="font-weight: bold; color: #333;">${group.totalAmount.toFixed(2)} ج.م</div>
                                                    <small style="color: #666; font-size: 0.8rem;">مجموع ${group.customers.length} شرائح</small>
                                                    <div style="font-size: 0.7rem; color: #999; margin-top: 0.2rem;">
                                                        ${group.customers.map(c => `سعر: ${c.package_price || 0} + دين: ${c.debt_amount || 0}`).join(' | ')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                                    <span style="background: ${isCollected ? '#28a745' : '#dc3545'}; color: white; padding: 0.5rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                                        ${isCollected ? '✅ تم التحصيل' : '⏳ لم يتم التحصيل'}
                                                    </span>
                                                    ${group.customers.length > 1 ? `
                                                        <div style="font-size: 0.8rem; color: #666;">
                                                            ✅ ${group.collectedCount} | ⏳ ${group.pendingCount}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                    }
                )
                .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    console.log("🔍 renderCustomersBySection - Container HTML after:", container.innerHTML.substring(0, 200) + "...");

    console.log(`🎉 All agent sections rendered. Total blocks: ${Object.keys(grouped).length}`);
};

// Export Agent Collection to Excel
window.exportAgentCollectionToExcel = (exportType = 'modern') => {
    if (!window.currentCustomersData || !window.currentCustomersData.length) {
        alert('لا توجد بيانات للتصدير');
        return;
    }

    const customers = window.currentCustomersData;
    const agentSelect = document.getElementById('performanceAgentSelect');
    const selectedOption = agentSelect.options[agentSelect.selectedIndex];
    const agentName = selectedOption.textContent;

    // Group customers by section
    const groupedBySection = customers.reduce((acc, customer) => {
        const section = customer.section || "غير محدد";
        if (!acc[section]) acc[section] = [];
        acc[section].push(customer);
        return acc;
    }, {});

    // تحضير البيانات حسب نوع التصدير - مع فصل الأقسام بأسطر
    let excelData = [];
    let colWidths, message, fileName;

    if (exportType === 'legacy') {
        // تصدير للإصدارات القديمة - مع رموز وفصل الأقسام
        Object.entries(groupedBySection).forEach(([section, sectionCustomers]) => {
            // Add section header row
            excelData.push({
                'اسم العميل': `🏢 القسم: ${section}`,
                'رقم الهاتف': '',
                'العنوان': '',
                'القسم': section,
                'المندوب': '',
                'المبلغ المستحق': '',
                'المبلغ المحصل': '',
                'حالة الدفع': '',
                'تاريخ التحصيل': '',
                'ملاحظات': '',
                'تاريخ الإضافة': ''
            });

            // Add empty row for spacing
            excelData.push({
                'اسم العميل': '',
                'رقم الهاتف': '',
                'العنوان': '',
                'القسم': '',
                'المندوب': '',
                'المبلغ المستحق': '',
                'المبلغ المحصل': '',
                'حالة الدفع': '',
                'تاريخ التحصيل': '',
                'ملاحظات': '',
                'تاريخ الإضافة': ''
            });

            // Add customers in this section
            sectionCustomers.forEach(customer => {
                let statusWithColor = customer.collection_status || "لم يتم التحصيل";

                switch (statusWithColor) {
                    case 'تم التحصيل':
                        statusWithColor = '✅ تم التحصيل';
                        break;
                    case 'لم يتم التحصيل':
                        statusWithColor = '❌ لم يتم التحصيل';
                        break;
                    case 'تحصيل جزئي':
                        statusWithColor = '⚠️ تحصيل جزئي';
                        break;
                    default:
                        statusWithColor = '❓ ' + statusWithColor;
                }

                const collectionInfo = (window.currentCollectionData && window.currentCollectionData[customer.id]) || { amount: 0, date: '-' };

                excelData.push({
                    'اسم العميل': customer.name || "",
                    'رقم الهاتف': customer.phone || "",
                    'العنوان': customer.address || "",
                    'القسم': section,
                    'المندوب': agentName || "غير محدد",
                    'المبلغ المستحق': calculateAmount(customer) || 0,
                    'المبلغ المحصل': collectionInfo.amount,
                    'حالة الدفع': statusWithColor,
                    'تاريخ التحصيل': collectionInfo.date,
                    'ملاحظات': customer.notes || "",
                    'تاريخ الإضافة': customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-SA') : ""
                });
            });

            // Add separator row between sections
            excelData.push({
                'اسم العميل': '', 'رقم الهاتف': '', 'العنوان': '', 'القسم': '', 'المندوب': '',
                'المبلغ المستحق': '', 'المبلغ المحصل': '', 'حالة الدفع': '', 'تاريخ التحصيل': '',
                'ملاحظات': '', 'تاريخ الإضافة': ''
            });
        });

        colWidths = [
            { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }
        ];

        fileName = `تحصيل_${agentName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}_رموز.xlsx`;

        message = `✅ تم تصدير ${customers.length} عميل بنجاح!\n\n📊 يحتوي الملف على:\n• ورقة بيانات العملاء مقسمة حسب الأقسام\n• ورقة إحصائيات التحصيل\n\n🏢 تقسيم الأقسام:\n• كل قسم في صفوف منفصلة\n• عناوين الأقسام واضحة\n• صفوف فاصلة بين الأقسام\n\n🎨 الرموز المستخدمة:\n• ✅ أخضر: تم التحصيل\n• ❌ أحمر: لم يتم التحصيل\n• ⚠️ أصفر: تحصيل جزئي\n\n💡 متوافق مع جميع إصدارات Excel (2007-2010-2013-2016-2019-365)\n\n👤 المندوب: ${agentName}`;

    } else {
        // تصدير للإصدارات الحديثة - مع ألوان وفصل الأقسام
        Object.entries(groupedBySection).forEach(([section, sectionCustomers]) => {
            // Add section header row
            excelData.push({
                'اسم العميل': `🏢 القسم: ${section}`,
                'رقم الهاتف': '',
                'العنوان': '',
                'القسم': section,
                'المندوب': '',
                'المبلغ المستحق': '',
                'المبلغ المحصل': '',
                'حالة الدفع': '',
                'تاريخ التحصيل': '',
                'ملاحظات': '',
                'تاريخ الإضافة': ''
            });

            // Add empty row for spacing
            excelData.push({
                'اسم العميل': '',
                'رقم الهاتف': '',
                'العنوان': '',
                'القسم': '',
                'المندوب': '',
                'المبلغ المستحق': '',
                'المبلغ المحصل': '',
                'حالة الدفع': '',
                'تاريخ التحصيل': '',
                'ملاحظات': '',
                'تاريخ الإضافة': ''
            });

            // Add customers in this section
            sectionCustomers.forEach(customer => {
                const collectionInfo = (window.currentCollectionData && window.currentCollectionData[customer.id]) || { amount: 0, date: '-' };

                excelData.push({
                    'اسم العميل': customer.name || "",
                    'رقم الهاتف': customer.phone || "",
                    'العنوان': customer.address || "",
                    'القسم': section,
                    'المندوب': agentName || "غير محدد",
                    'المبلغ المستحق': calculateAmount(customer) || 0,
                    'المبلغ المحصل': collectionInfo.amount,
                    'حالة الدفع': customer.collection_status || "لم يتم التحصيل",
                    'تاريخ التحصيل': collectionInfo.date,
                    'ملاحظات': customer.notes || "",
                    'تاريخ الإضافة': customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-SA') : ""
                });
            });

            // Add separator row between sections
            excelData.push({
                'اسم العميل': '', 'رقم الهاتف': '', 'العنوان': '', 'القسم': '', 'المندوب': '',
                'المبلغ المستحق': '', 'المبلغ المحصل': '', 'حالة الدفع': '', 'تاريخ التحصيل': '',
                'ملاحظات': '', 'تاريخ الإضافة': ''
            });
        });

        colWidths = [
            { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }
        ];

        fileName = `تحصيل_${agentName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}_ألوان.xlsx`;

        message = `✅ تم تصدير ${customers.length} عميل بنجاح!\n\n📊 يحتوي الملف على:\n• ورقة بيانات العملاء مقسمة حسب الأقسام\n• ورقة إحصائيات التحصيل\n\n🏢 تقسيم الأقسام:\n• كل قسم في صفوف منفصلة\n• عناوين الأقسام واضحة\n• صفوف فاصلة بين الأقسام\n\n🎨 لتفعيل الألوان في Excel:\n1. افتح الملف في Excel 2013 أو أحدث\n2. حدد عمود "حالة الدفع"\n3. اذهب إلى Conditional Formatting > Color Scales\n4. اختر: Green-Yellow-Red scale\n\n💡 للألوان التلقائية: استخدم Excel 2016 أو أحدث\n\n👤 المندوب: ${agentName}`;
    }

    // إنشاء ورقة العمل
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = colWidths;

    // إنشاء مصنف جديد
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تحصيل المندوب");

    // إضافة ورقة ثانية للإحصائيات
    const statsData = generateCollectionStats(customers);
    const statsWs = XLSX.utils.json_to_sheet(statsData);
    statsWs['!cols'] = [
        { wch: 20 }, // الوصف
        { wch: 15 }, // القيمة
        { wch: 30 }  // ملاحظات
    ];
    XLSX.utils.book_append_sheet(wb, statsWs, "إحصائيات التحصيل");

    // حفظ الملف
    XLSX.writeFile(wb, fileName);

    // رسالة تأكيد
    alert(message);
};

// Filter function for agent sheet (New optimized version)
window.filterAgentSheet = (status = null) => {
    const buttons = document.querySelectorAll('.agent-filter-btn');
    const sectionSelect = document.getElementById('agentSectionFilter');

    // Determine active status
    let activeStatus = status;
    if (activeStatus === null) {
        const activeBtn = document.querySelector('.agent-filter-btn.active');
        activeStatus = activeBtn ? activeBtn.dataset.filter : 'all';
    }

    // Update button styles if a status was explicitly passed
    if (status !== null) {
        buttons.forEach(btn => {
            btn.style.background = btn.dataset.filter === status ? '#007bff' : '#6c757d';
            btn.classList.toggle('active', btn.dataset.filter === status);
        });
    }

    const selectedSection = sectionSelect ? sectionSelect.value : 'all';

    // Filter data
    let filtered = window.currentCustomersData || [];

    // Apply status filter
    if (activeStatus === 'collected') {
        filtered = filtered.filter(c => c.collection_status === 'تم التحصيل');
    } else if (activeStatus === 'pending') {
        filtered = filtered.filter(c => c.collection_status !== 'تم التحصيل');
    }

    // Apply section filter
    if (selectedSection !== 'all') {
        filtered = filtered.filter(c => (c.section || "غير محدد") === selectedSection);
    }

    // Re-render
    renderAgentCustomersBySection(filtered, window.currentCollectionAmounts || {});
};

// Export specific section to Excel
window.exportAgentSectionToExcel = (sectionName) => {
    if (!window.currentCustomersData) return;

    const sectionCustomers = window.currentCustomersData.filter(c => (c.section || "غير محدد") === sectionName);
    if (!sectionCustomers.length) {
        alert('لا توجد بيانات لهذا القسم');
        return;
    }

    const agentSelect = document.getElementById('performanceAgentSelect');
    const agentName = agentSelect.options[agentSelect.selectedIndex].textContent;

    const excelData = sectionCustomers.map(customer => {
        const collectionInfo = (window.currentCollectionData && window.currentCollectionData[customer.id]) || { amount: 0, date: '-' };

        return {
            'اسم العميل': customer.name || "",
            'رقم الهاتف': customer.phone || "",
            'العنوان': customer.address || "",
            'القسم': sectionName,
            'المندوب': agentName || "غير محدد",
            'المبلغ المستحق': calculateAmount(customer) || 0,
            'المبلغ المحصل': collectionInfo.amount,
            'حالة الدفع': customer.collection_status || "لم يتم التحصيل",
            'تاريخ التحصيل': collectionInfo.date,
            'ملاحظات': customer.notes || "",
            'تاريخ الإضافة': customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-SA') : ""
        };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "بيانات القسم");

    const fileName = `قسم_${sectionName.replace(/\s+/g, '_')}_${agentName.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    alert(`✅ تم تصدير بيانات قسم (${sectionName}) بنجاح!`);
};

// Keep old filterCustomers for other tabs if needed, but we renamed agent filters to filterAgentSheet
window.filterCustomers = (filter) => {
    // ... rest of original filterCustomers code ... 
    // Actually, management tab uses initializeManagement.filterCustomers, so this global one might be legacy
    // I will keep it for safety but it's likely not used for the modal anymore.
};

async function initializePerformance() {
    // Use global Supabase client
    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return;
    }

    const { data: agents, error } = await supabaseClient.from('agents').select('*');
    const container = document.getElementById('performanceContent');

    if (error) {
        container.innerHTML = `<div style="color: red;">خطأ: ${error.message}</div>`;
        return;
    }

    const performanceData = await Promise.all(agents.map(async agent => {
        // Get customers for this agent
        const { data: customers } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('agent_id', agent.id);

        // Get collections for this agent to get correct amounts
        const { data: collections } = await supabaseClient
            .from('collections')
            .select('*')
            .eq('collected_by', agent.id);

        // Create a map of customer_id to collection amount (same logic as collections.html)
        const collectionAmounts = {};
        collections?.forEach(collection => {
            if (collection.customer_id) {
                const amount = collection.amount || collection.original_amount || collection.debt_amount || 0;
                collectionAmounts[collection.customer_id] = parseFloat(amount) || 0;
            }
        });

        // Process customers with collection amounts (same logic as collections.html)
        const processedCustomers = customers?.map(customer => {
            return {
                ...customer,
                display_amount: calculateAmount(customer, collectionAmounts)
            };
        }) || [];

        const totalCustomers = processedCustomers?.length || 0;
        const collectedCustomers = processedCustomers?.filter(c => c.collection_status === 'تم التحصيل').length || 0;

        // Calculate statistics using original customer data and collection records
        const totalAmount = customers?.reduce((sum, c) => {
            // الإجمالي النظري = الباقة + الدين القديم (بدون اعتبار حالة التحصيل الحالية)
            const pkg = parseFloat(c.package_price || 0);
            const debt = parseFloat(c.debt_amount || 0);
            const due = parseFloat(c.due_amount || 0);
            return sum + (pkg + debt + due);
        }, 0) || 0;

        // المبلغ المحصل = مجموع المبالغ في جدول collections لهذا المندوب
        const collectedAmount = collections?.reduce((sum, col) => sum + (parseFloat(col.amount) || 0), 0) || 0;

        // المبلغ المتبقي = إجمالي المطلوب حالياً من العملاء الذين لم يسددوا
        const pendingAmount = processedCustomers.reduce((sum, c) => sum + c.display_amount, 0);

        return {
            agent,
            totalCustomers,
            collectedCustomers,
            pendingCustomers: totalCustomers - collectedCustomers,
            totalAmount,
            collectedAmount,
            pendingAmount: pendingAmount,
            collectionRate: totalAmount > 0 ? (collectedAmount / totalAmount * 100).toFixed(1) : 0
        };
    }));

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            ${performanceData.map(data => `
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-top: 4px solid #ff6b35;">
                    <h3 style="margin-bottom: 1rem; color: #333;">${data.agent.name}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.9rem;">
                        <div><strong>👥 إجمالي العملاء:</strong> ${data.totalCustomers}</div>
                        <div><strong>✅ تم التحصيل:</strong> ${data.collectedCustomers}</div>
                        <div><strong>⏳ لم يتم:</strong> ${data.pendingCustomers}</div>
                        <div><strong>📊 نسبة التحصيل:</strong> ${data.collectionRate}%</div>
                        <div><strong>💰 إجمالي المبلغ:</strong> ${data.totalAmount.toFixed(2)}</div>
                        <div><strong>💵 تم تحصيله:</strong> ${data.collectedAmount.toFixed(2)}</div>
                    </div>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                        <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #4caf50, #8bc34a); height: 100%; width: ${data.collectionRate}%; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: #666;">
                            نسبة الإنجاز: ${data.collectionRate}%
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load Upload Content
async function loadUploadContent(container) {
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">📁 رفع البيانات</h2>
            <p style="color: #666;">رفع ملفات Excel لإضافة عملاء بشكل جماعي</p>
        </div>
        
        <div style="max-width: 800px; margin: 0 auto;">
            <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border-right: 5px solid #2196f3;">
                <h4 style="margin-top: 0; color: #1976d2;">💡 ترتيب أعمدة ملف الـ Excel:</h4>
                <p style="margin-bottom: 0.5rem; font-size: 0.9rem;">يجب أن يحتوي الملف على الأعمدة بالترتيب التالي:</p>
                <ol style="font-size: 0.85rem; margin-bottom: 10px;">
                    <li><strong>الاسم</strong></li>
                    <li><strong>الهاتف</strong></li>
                    <li><strong>العنوان</strong></li>
                    <li><strong>القسم</strong></li>
                    <li><strong>سعر الباقة</strong> (سيتم حفظه كقيمة ثابتة)</li>
                    <li><strong>المبلغ المتأخر/المديونية</strong> (سيتم تجاهله للبدء من 0)</li>
                    <li><strong>نوع الباقة</strong> (مثلاً: ذهبية، فضية)</li>
                    <li><strong>الحالة</strong> (سيتم تعيينها تلقائياً "تم التحصيل")</li>
                </ol>
                <p style="background: #d4edda; padding: 10px; border-radius: 6px; font-size: 0.85rem; margin: 0; border: 1px solid #c3e6cb; color: #155724;">
                    ✅ <strong>الوضع الحالي:</strong> سيتم حفظ "سعر الباقة" كما هو في الملف، ولكن سيتم ضبط حالة العميل على <strong>"تم التحصيل"</strong> ليكون إجمالي المبلغ المستحق <strong>0</strong> عند الرفع لأول مرة.
                </p>
            </div>

            <div style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 1rem;">اختر المندوب</h3>
                <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <select id="uploadAgentSelect" style="flex: 1; min-width: 200px; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
                        <option value="">اختر مندوب موجود</option>
                    </select>
                    <span style="color: #666;">أو</span>
                    <input type="text" id="newAgentName" placeholder="اسم مندوب جديد" style="flex: 1; min-width: 200px; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
            </div>
            
            <div class="upload-area" style="border: 2px dashed #ddd; border-radius: 8px; padding: 40px; text-align: center; margin: 20px 0; transition: all 0.3s ease; cursor: pointer;" 
                 ondrop="handleDrop(event)" 
                 ondragover="handleDragOver(event)" 
                 ondragleave="handleDragLeave(event)"
                 onclick="document.getElementById('fileInput').click()">
                <div style="font-size: 48px; color: #ff6b35; margin-bottom: 20px;">📁</div>
                <h3 style="margin-bottom: 1rem;">اسحب ملف Excel هنا أو انقر للاختيار</h3>
                <p style="color: #666;">يدعم ملفات .xlsx, .xls, .csv</p>
                <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display: none;" onchange="handleFileSelect(event)">
            </div>
            
            <div id="uploadResult" style="margin-top: 2rem;"></div>
        </div>
    `;

    // Load agents for upload
    await loadUploadAgents();

    async function loadUploadAgents() {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return;

        try {
            const { data: agents, error } = await supabaseClient
                .from("agents")
                .select("id, name")
                .order("name");

            if (error) return;

            const select = document.getElementById("uploadAgentSelect");
            agents.forEach(agent => {
                const option = document.createElement("option");
                option.value = agent.id;
                option.textContent = agent.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading agents for upload:", error);
        }
    }

    window.handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    window.handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    };

    window.handleDragLeave = (e) => {
        e.currentTarget.classList.remove('dragover');
    };

    window.handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    window.processFile = async (file) => {
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        try {
            const data = await readExcelFile(file);

            if (data.length === 0) {
                resultDiv.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">
                        ❌ الملف فارغ أو لا يحتوي على بيانات صالحة
                    </div>
                `;
                return;
            }

            resultDiv.innerHTML = `
                <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    ✅ تم قراءة الملف بنجاح! عدد الصفوف: ${data.length}
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">الاسم</th>
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">الهاتف</th>
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">العنوان</th>
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">القسم</th>
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">سعر الباقة</th>
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">المبلغ المتأخر</th>
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">نوع الباقة</th>
                                <th style="padding: 0.5rem; border: 1px solid #ddd;">الحالة</th>
                                <!-- <th style="padding: 0.5rem; border: 1px solid #ddd;">تاريخ التحصيل</th> -->
                            </tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 5).map(row => `
                                <tr>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.name || '-'}</td>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.phone || '-'}</td>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.address || '-'}</td>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.section || '-'}</td>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.package_price || '-'}</td>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.debt_amount || '-'}</td>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.package_type || '-'}</td>
                                    <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.collection_status || '-'}</td>
                                    <!-- <td style="padding: 0.5rem; border: 1px solid #ddd;">${row.collection_date || '-'}</td> -->
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${data.length > 5 ? `<p style="text-align: center; color: #666;">... و ${data.length - 5} صفوف أخرى</p>` : ''}
                <button onclick="uploadData(${JSON.stringify(data).replace(/"/g, '&quot;')})" class="btn btn-primary" style="margin-top: 1rem; background: #ff6b35; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">
                    رفع البيانات إلى قاعدة البيانات
                </button>
            `;
        } catch (error) {
            resultDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">
                    ❌ خطأ في قراءة الملف: ${error.message}
                </div>
            `;
        }
    };

    window.readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                    // Read with header: 1 to get array format like the original
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                    // Convert to object format like the original
                    if (jsonData.length < 2) {
                        resolve([]);
                        return;
                    }

                    const headers = jsonData[0];
                    const dataRows = jsonData.slice(1);

                    const processedData = dataRows.map((row, index) => {
                        const customer = {
                            name: row[0] || '',                    // الاسم
                            phone: row[1] || '',                   // رقم الهاتف
                            address: row[2] || '',                 // العنوان
                            section: row[3] || 'غير محدد',         // القسم
                            package_price: parseFloat(row[4]) || 0, // سعر الباقة
                            debt_amount: parseFloat(row[5]) || 0,   // المبلغ المتأخر
                            package_type: row[6] || '',             // نوع الباقة
                            collection_status: row[7] || 'لم يتم التحصيل', // الحالة
                            // collection_date: row[8] || null,        // تاريخ التحصيل (تم إزالته لأنه غير موجود في قاعدة البيانات)
                            row_number: index + 2
                        };

                        console.log(`📋 Processing row ${index + 2}:`, customer);
                        return customer;
                    }).filter(customer => customer.name && customer.phone);

                    resolve(processedData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    window.uploadData = async (data) => {
        // Use global Supabase client
        const supabaseClient = window.supabaseClient;

        if (!supabaseClient) {
            console.error('❌ Supabase client not initialized');
            return;
        }

        if (data.length === 0) {
            alert("لا توجد بيانات صالحة للرفع");
            return;
        }

        // Check agent selection
        const selectedAgentId = document.getElementById("uploadAgentSelect").value;
        const newAgentName = document.getElementById("newAgentName").value.trim();
        let finalAgentId = null;

        if (newAgentName) {
            // Create new agent
            try {
                const { data: newAgent, error: createError } = await supabaseClient
                    .from("agents")
                    .insert([{
                        name: newAgentName,
                        email: `${newAgentName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                        phone: "00000000000",
                        password: "temp123",
                        role: "agent",
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (createError) {
                    alert("فشل إنشاء المندوب الجديد");
                    return;
                }

                finalAgentId = newAgent.id;
                alert(`تم إنشاء المندوب "${newAgentName}" بنجاح`);
            } catch (error) {
                alert("حدث خطأ أثناء إنشاء المندوب");
                return;
            }
        } else if (selectedAgentId) {
            finalAgentId = selectedAgentId;
        } else {
            alert("يرجى اختيار مندوب أو إضافة مندوب جديد");
            return;
        }

        const resultDiv = document.getElementById('uploadResult');
        resultDiv.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        try {
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < data.length; i++) {
                const customer = data[i];

                try {
                    const customerData = {
                        name: customer.name || '',
                        phone: String(customer.phone) || '',
                        address: customer.address || '',
                        debt_amount: Number(customer.debt_amount) || 0, // استخدام المديونية من ملف الإكسيل
                        due_amount: 0, // تصفير المبلغ الإضافي للفترة الجديدة
                        package_price: Number(customer.package_price) || 0, // استخدام سعر الباقة من ملف الإكسيل
                        section: customer.section || 'غير محدد',
                        agent_id: finalAgentId,
                        billing_month: new Date().toISOString().slice(0, 7),
                        collection_status: 'تم التحصيل', // ضبط الحالة إلى محصل ليظهر الإجمالي 0
                        status: 'تم التحصيل', // لمزامنة الحقل القديم
                        package_type: customer.package_type || '',
                        created_at: new Date().toISOString()
                    };

                    console.log('📤 Uploading customer data:', customerData);

                    const { error: insertError } = await supabaseClient.from('customers').insert(customerData);

                    if (insertError) {
                        console.error('❌ Insert error for customer:', customer.name, insertError);
                        throw insertError;
                    }

                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`Error uploading customer ${i + 1}:`, error);
                }
            }

            resultDiv.innerHTML = `
                <div style="background: ${errorCount > 0 ? '#fff3cd' : '#d4edda'}; color: ${errorCount > 0 ? '#856404' : '#155724'}; padding: 1rem; border-radius: 8px;">
                    ${errorCount > 0 ?
                    `⚠️ تم رفع ${successCount} عميل بنجاح، و ${errorCount} عميل فشل رفعهم` :
                    `✅ تم رفع ${successCount} عميل بنجاح إلى قاعدة البيانات!`
                }
                </div>
            `;
        } catch (error) {
            resultDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">
                    ❌ خطأ في رفع البيانات: ${error.message}
                </div>
            `;
        }
    };
}

// Load Notes Content
async function loadNotesContent(container) {
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">📝 الملاحظات</h2>
            <p style="color: #666;">ملاحظات المناديب عن العملاء مع تفاصيل التحصيل</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">اختر المندوب:</label>
            <select id="notesAgentSelect" style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; width: 300px;">
                <option value="">اختر المندوب</option>
            </select>
        </div>
        
        <div id="notesContent">
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    await initializeNotes();
}

async function initializeNotes() {
    // Use global Supabase client
    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return;
    }

    const agentSelect = document.getElementById("notesAgentSelect");
    const notesContainer = document.getElementById("notesContent");

    // Load agents
    await loadAgents();

    async function loadAgents() {
        const { data, error } = await supabaseClient
            .from("agents")
            .select("id, name");
        if (error) return alert("⚠️ خطأ في تحميل المناديب");

        data.forEach((agent) => {
            const option = document.createElement("option");
            option.value = agent.id;
            option.textContent = agent.name;
            agentSelect.appendChild(option);
        });
    }

    agentSelect.addEventListener("change", async () => {
        const agent_id = agentSelect.value;
        notesContainer.innerHTML = "";

        if (!agent_id) return;

        notesContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        try {
            // Get customers first
            const { data: customers, error: customersError } = await supabaseClient
                .from("customers")
                .select("id, name, phone, debt_amount, collection_status")
                .eq("agent_id", agent_id);

            if (customersError) {
                console.error("Error loading customers:", customersError);
                notesContainer.innerHTML = '<div style="color: red; text-align: center; padding: 2rem;">خطأ في تحميل بيانات العملاء</div>';
                return;
            }

            // Get notes for this agent (use DISTINCT to avoid duplicates)
            const { data: notes, error: notesError } = await supabaseClient
                .from("agent_notes")
                .select("customer_phone, note_text")
                .eq("agent_id", agent_id);

            if (notesError) {
                console.error("Error loading notes:", notesError);
                notesContainer.innerHTML = '<div style="color: red; text-align: center; padding: 2rem;">خطأ في تحميل الملاحظات</div>';
                return;
            }

            // Filter customers who have notes (avoid duplicates)
            const customersWithNotes = [];
            const processedPhones = new Set();

            customers.forEach(customer => {
                if (processedPhones.has(customer.phone)) return;

                const note = notes.find((n) => n.customer_phone === customer.phone)?.note_text;
                if (note && note.trim()) {
                    customersWithNotes.push(customer);
                    processedPhones.add(customer.phone);
                }
            });

            if (!customersWithNotes || customersWithNotes.length === 0) {
                notesContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">لا يوجد عملاء لديهم ملاحظات لهذا المندوب</div>';
                return;
            }

            // Get collections for these customers
            const customerIds = customersWithNotes.map(c => c.id);
            const { data: collections } = await supabaseClient
                .from("collections")
                .select("customer_id, created_at")
                .in("customer_id", customerIds)
                .eq("collected_by", agent_id);

            // Process the data
            const allCustomersWithNotes = customersWithNotes.map((customer) => {
                const note = notes.find((n) => n.customer_phone === customer.phone)?.note_text || "";
                const colls = collections.filter((col) => col.customer_id === customer.id);
                const latest = colls.length
                    ? new Date(
                        new Date(
                            colls.reduce((max, c) =>
                                new Date(c.created_at) >
                                    new Date(max.created_at)
                                    ? c
                                    : max
                            ).created_at
                        ).getTime() +
                        3 * 60 * 60 * 1000
                    ).toLocaleString("ar-EG")
                    : "-";

                return {
                    name: customer.name,
                    phone: customer.phone,
                    amount: customer.debt_amount,
                    status: customer.collection_status,
                    date: latest,
                    note: note,
                    hasNote: true
                };
            });

            // Show only customers with notes
            if (!allCustomersWithNotes.length) {
                notesContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">لا يوجد عملاء لديهم ملاحظات لهذا المندوب</div>';
                return;
            }

            notesContainer.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <p style="color: #666;">عدد العملاء الذين لديهم ملاحظات: ${allCustomersWithNotes.length}</p>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">اسم العميل</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">رقم الهاتف</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">قيمة الفاتورة</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">حالة التحصيل</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">آخر تحصيل</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الملاحظة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allCustomersWithNotes
                    .map(
                        (row) => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 1rem; font-weight: bold;">${row.name}</td>
                                    <td style="padding: 1rem;">${row.phone}</td>
                                    <td style="padding: 1rem;">${row.amount} ج.م</td>
                                    <td style="padding: 1rem;">
                                        <span style="background: ${row.status === 'تم التحصيل' ? '#28a745' : '#ffc107'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">
                                            ${row.status}
                                        </span>
                                    </td>
                                    <td style="padding: 1rem;">${row.date}</td>
                                    <td style="padding: 1rem; max-width: 300px; font-size: 0.9rem; color: #333;">${row.note}</td>
                                </tr>`
                    )
                    .join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error("Error loading notes:", error);
            notesContainer.innerHTML = '<div style="color: red; text-align: center; padding: 2rem;">خطأ في تحميل الملاحظات</div>';
        }
    });
}

// Load Disconnected Content
async function loadDisconnectedContent(container) {
    container.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">📵 الخطوط المنفصلة</h2>
            <p style="color: #666;">طلبات وقف الخدمة من العملاء</p>
        </div>
        
        <div id="disconnectedContent">
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    await initializeDisconnected();
}

async function initializeDisconnected() {
    // Use global Supabase client
    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error('❌ Supabase client not initialized');
        return;
    }

    const { data: requests, error } = await supabaseClient
        .from('stop_requests')
        .select(`
            *,
            agents(name)
        `)
        .order('created_at', { ascending: false });

    const container = document.getElementById('disconnectedContent');

    if (error) {
        container.innerHTML = `<div style="color: red;">خطأ: ${error.message}</div>`;
        return;
    }

    if (!requests.length) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">لا توجد طلبات وقف خدمة</div>';
        return;
    }

    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">اسم العميل</th>
                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">الهاتف</th>
                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">المندوب</th>
                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">السبب</th>
                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">التاريخ</th>
                        <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(request => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 1rem;">${request.customer_name}</td>
                            <td style="padding: 1rem;">${request.customer_phone}</td>
                            <td style="padding: 1rem;">${request.agents?.name || '-'}</td>
                            <td style="padding: 1rem;">${request.reason || '-'}</td>
                            <td style="padding: 1rem;">${new Date(request.created_at).toLocaleDateString('ar-EG')}</td>
                            <td style="padding: 1rem;">
                                <button onclick="activateLine('${request.id}', this)" class="btn btn-sm btn-success" style="background: #28a745; margin-left: 0.5rem;">✅ تشغيل</button>
                                <button onclick="deleteStopRequest('${request.id}')" class="btn btn-sm btn-danger">🗑️ حذف</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    window.activateLine = async (lineId, button) => {
        const confirmed = confirm("✅ هل أنت متأكد من تشغيل هذا الخط؟");
        if (!confirmed) return;

        try {
            const { error } = await supabaseClient
                .from("stop_requests")
                .delete()
                .eq("id", lineId);

            if (error) {
                alert("❌ حدث خطأ أثناء تشغيل الخط");
                console.error(error);
                return;
            }

            alert("✔️ تم تشغيل الخط وحذفه من قائمة الخطوط المتوقفة");
            // Remove the row from table
            const row = button.closest("tr");
            row.style.transition = "opacity 0.3s ease";
            row.style.opacity = "0";
            setTimeout(() => row.remove(), 300);
        } catch (error) {
            alert("❌ حدث خطأ غير متوقع");
            console.error(error);
        }
    };

    window.deleteStopRequest = async (id) => {
        if (!confirm('هل تريد حذف هذا الطلب؟')) return;
        await supabaseClient.from('stop_requests').delete().eq('id', id);
        await initializeDisconnected();
    };
}

// Collection Period Management Functions
window.startNewPeriod = async (event) => {
    // Prevent page reload
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    try {
        const confirmed = confirm("🚀 هل أنت متأكد من بدء فترة تحصيل جديدة؟\n\nسيتم:\n• إضافة سعر الباقة للعملاء غير المحصلين فقط\n• العملاء الذين تم تحصيلهم يبدأون من صفر\n• إعادة تعيين جميع العملاء كغير محصلين\n• بدء فترة جديدة من تاريخ اليوم");

        if (!confirmed) return;

        const supabaseClient = window.supabaseClient;
        const agentSelect = document.getElementById("adminAgentSelect");
        const agentId = agentSelect?.value;

        if (!agentId) {
            alert("⚠️ يرجى اختيار مندوب أولاً");
            return;
        }

        // Show loading indicator with unique ID
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'period-loading-overlay';
        loadingDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.7); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            flex-direction: column; color: white;
        `;
        loadingDiv.innerHTML = `
            <div style="
                width: 60px; height: 60px; 
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #ff6b35;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            "></div>
            <div style="font-size: 1.2rem; font-weight: bold;">جاري بدء فترة جديدة...</div>
            <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;">يرجى الانتظار</div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingDiv);

        console.log("🚀 Starting new period for agent:", agentId);

        // Get current customers for this agent
        const { data: customers, error: customersError } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('agent_id', agentId);

        if (customersError) {
            console.error("❌ Error getting customers:", customersError);
            document.body.removeChild(loadingDiv);
            alert("❌ خطأ في جلب بيانات العملاء: " + customersError.message);
            return;
        }

        if (!customers || customers.length === 0) {
            console.log("📭 No customers found");
            document.body.removeChild(loadingDiv);
            alert("⚠️ لا يوجد عملاء لهذا المندوب");
            return;
        }

        console.log("📊 Found customers:", customers.length);

        // Define package price (you can make this configurable later)
        const defaultPackagePrice = 50;

        // Process customers - compute full due (including due_amount) then carry over to debt_amount
        const updates = customers.map(async (customer) => {
            try {
                // ✅ الحساب الصحيح: إذا لم يتم التحصيل، نرحل كامل المبلغ المستحق (الباقة + الدين + الإضافي) إلى الدين الجديد
                // إذا تم التحصيل، الدين الجديد يكون صفر
                const isUncollected = customer.collection_status !== 'تم التحصيل';
                const currentTotalDue = calculateAmount(customer);
                const newDebtAmount = isUncollected ? currentTotalDue : 0;

                const packagePrice = parseFloat(customer.package_price) || 0;

                console.log(`🔄 Updating customer ${customer.id}:`, {
                    name: customer.name,
                    status: customer.collection_status,
                    currentTotalDue,
                    newDebtAmount
                });

                // Update customer with new amount and reset status
                const updateData = {
                    debt_amount: newDebtAmount,
                    due_amount: 0, // تصفير المبلغ الإضافي للفترة الجديدة
                    collection_status: 'لم يتم التحصيل'
                };

                const { error } = await supabaseClient
                    .from('customers')
                    .update(updateData)
                    .eq('id', customer.id);

                if (error) {
                    console.error(`❌ Error updating customer ${customer.id}:`, error);
                    throw error;
                }

                return {
                    customerName: customer.name,
                    newDebtAmount: newDebtAmount,
                    packagePrice: packagePrice
                };
            } catch (error) {
                console.error(`❌ Failed to update customer ${customer.id}:`, error);
                throw error;
            }
        });

        const results = await Promise.allSettled(updates);
        const processedCustomers = [];
        const failedCustomers = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                processedCustomers.push(result.value);
            } else {
                failedCustomers.push({
                    index,
                    customer: customers[index],
                    error: result.reason
                });
            }
        });

        console.log("📊 Update results:", { processed: processedCustomers.length, failed: failedCustomers.length });

        if (failedCustomers.length > 0) {
            console.error('❌ Failed to update some customers:', failedCustomers);
        }

        // Create new collection period record
        try {
            const { error: periodError } = await supabaseClient
                .from('collection_periods')
                .insert({
                    agent_id: agentId,
                    start_date: new Date().toISOString(),
                    total_customers: customers.length,
                    uncollected_customers: processedCustomers.length,
                    total_amount: customers.reduce((sum, c) => sum + calculateAmount(c), 0),
                    collected_amount: customers.filter(c => c.collection_status === 'تم التحصيل').reduce((sum, c) => sum + calculateAmount(c), 0),
                    package_price: defaultPackagePrice
                });

            if (periodError) {
                console.warn('Could not create period record:', periodError);
            }
        } catch (error) {
            console.warn('Error creating period record:', error);
        }

        // Remove loading indicator
        const loadingElement = document.getElementById('period-loading-overlay');
        if (loadingElement) {
            document.body.removeChild(loadingElement);
        }

        // Show success message
        alert(`✅ تم بدء فترة تحصيل جديدة بنجاح!\n\n📊 التفاصيل:\n• عدد العملاء المعالجين: ${processedCustomers.length}\n• تم إضافة سعر الباقة للمبلغ المتأخر (تراكمي)\n• تم إعادة تعيين جميع العملاء كغير محصلين${failedCustomers.length > 0 ? `\n⚠️ فشل تحديث ${failedCustomers.length} عملاء` : ''}`);

        // Wait a moment for database to update, then refresh the data
        setTimeout(async () => {
            try {
                console.log("🔄 Refreshing data after new period...");

                // Use sectionsContainer to preserve page layout
                const container = document.getElementById("sectionsContainer");
                if (container) {
                    console.log("📦 Found container:", container.id);
                    await window.loadCustomersByAgent(container);
                } else {
                    console.warn("⚠️ Could not find sectionsContainer");
                }

                // Update collection period status
                await window.updateCollectionPeriodStatus();

            } catch (error) {
                console.error("❌ Error refreshing data:", error);
                // Don't show alert to avoid disrupting user experience
            }
        }, 500); // Wait 500ms for database updates

    } catch (error) {
        console.error('❌ Error starting new collection period:', error);

        // Remove loading indicator if exists
        const loadingElement = document.getElementById('period-loading-overlay');
        if (loadingElement) {
            document.body.removeChild(loadingElement);
        }

        alert('❌ حدث خطأ أثناء بدء فترة التحصيل الجديدة: ' + error.message);
    }
};

window.endCollectionPeriod = async (event) => {
    // Prevent page reload
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const confirmed = confirm("🏁 هل أنت متأكد من إنهاء فترة التحصيل الحالية؟\n\nسيتم:\n• حفظ إحصائيات الفترة الحالية\n• إعادة تعيين جميع المبالغ لسعر الباقة فقط\n• إعادة تعيين جميع العملاء كغير محصلين");

    if (!confirmed) return;

    try {
        const supabaseClient = window.supabaseClient;
        const agentSelect = document.getElementById("adminAgentSelect");
        const agentId = agentSelect.value;

        if (!agentId) {
            alert("⚠️ يرجى اختيار مندوب أولاً");
            return;
        }

        // Get current customers for this agent
        const { data: customers, error: customersError } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('agent_id', agentId);

        if (customersError) {
            alert("❌ خطأ في جلب بيانات العملاء");
            return;
        }

        // Create collection period record for current period
        const { error: periodError } = await supabaseClient
            .from('collection_periods')
            .insert({
                agent_id: agentId,
                end_date: new Date().toISOString(),
                total_customers: customers.length,
                uncollected_customers: customers.filter(c => c.collection_status !== 'تم التحصيل').length,
                total_amount: customers.reduce((sum, c) => sum + calculateAmount(c), 0),
                collected_amount: customers.filter(c => c.collection_status === 'تم التحصيل').reduce((sum, c) => sum + calculateAmount(c), 0)
            });

        if (periodError) {
            console.warn('Could not create period record:', periodError);
        }

        // Reset collection status only; keep debt_amount intact so previous outstanding carries over
        const resetUpdates = customers.map(async (customer) => {
            console.log(`🔄 Resetting customer ${customer.id} status only:`, {
                name: customer.name,
                oldAmount: customer.debt_amount
            });

            const { error } = await supabaseClient
                .from('customers')
                .update({
                    collection_status: 'لم يتم التحصيل'
                })
                .eq('id', customer.id);

            if (error) {
                console.error(`❌ Error resetting customer ${customer.id}:`, error);
                throw error;
            }

            return {
                customerName: customer.name
            };
        });

        const resetResults = await Promise.allSettled(resetUpdates);
        const successResets = resetResults.filter(r => r.status === 'fulfilled').length;
        const failedResets = resetResults.filter(r => r.status === 'rejected').length;

        // Show success message
        alert(`✅ تم إنهاء فترة التحصيل بنجاح!\n\n📊 التفاصيل:\n• إجمالي العملاء: ${customers.length}\n• تم إعادة تعيين ${successResets} عملاء لسعر الباقة فقط\n• تم حفظ إحصائيات الفترة`);

        // Refresh the data
        setTimeout(async () => {
            try {
                console.log("🔄 Refreshing data after ending period...");

                // Use sectionsContainer to preserve page layout
                const container = document.getElementById("sectionsContainer");
                if (container) {
                    console.log("📦 Found container:", container.id);
                    await window.loadCustomersByAgent(container);
                } else {
                    console.warn("⚠️ Could not find sectionsContainer");
                }

                // Update collection period status
                await window.updateCollectionPeriodStatus();

            } catch (error) {
                console.error("❌ Error refreshing data:", error);
                // Don't show alert to avoid disrupting user experience
            }
        }, 500);

    } catch (error) {
        console.error('Error ending collection period:', error);
        alert('❌ حدث خطأ أثناء إنهاء فترة التحصيل');
    }
};

window.showCollectionHistory = async () => {
    try {
        const supabaseClient = window.supabaseClient;
        const agentSelect = document.getElementById("adminAgentSelect");
        const agentId = agentSelect.value;

        if (!agentId) {
            alert("⚠️ يرجى اختيار مندوب أولاً");
            return;
        }

        // Get collection periods history
        const { data: periods, error } = await supabaseClient
            .from('collection_periods')
            .select('*')
            .eq('agent_id', agentId)
            .order('end_date', { ascending: false });

        if (error) {
            alert("❌ خطأ في جلب سجل التحصيل");
            return;
        }

        if (!periods || periods.length === 0) {
            alert("📜 لا يوجد سجل فترات تحصيل لهذا المندوب");
            return;
        }

        // Create modal for history
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.5); z-index: 10000; 
            display: flex; align-items: center; justify-content: center;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 800px; max-height: 80vh; overflow-y: auto; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; color: #333;">📜 سجل فترات التحصيل</h3>
                    <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✖️</button>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">تاريخ الإنتهاء</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">إجمالي العملاء</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">غير المحصلين</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">إجمالي المبلغ المستحق</th>
                                <th style="padding: 1rem; text-align: right; border-bottom: 2px solid #ddd;">المبلغ المحصل</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${periods.map(period => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 1rem;">${new Date(period.end_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    <td style="padding: 1rem;">${period.total_customers}</td>
                                    <td style="padding: 1rem; color: #dc3545; font-weight: bold;">${period.uncollected_customers}</td>
                                    <td style="padding: 1rem;">${period.total_amount?.toFixed(2) || 0} ج.م</td>
                                    <td style="padding: 1rem; color: #28a745; font-weight: bold;">${period.collected_amount?.toFixed(2) || 0} ج.م</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error showing collection history:', error);
        alert('❌ حدث خطأ أثناء عرض السجل');
    }
};

window.updateCollectionPeriodStatus = async () => {
    try {
        const supabaseClient = window.supabaseClient;
        const agentSelect = document.getElementById("adminAgentSelect");
        const agentId = agentSelect?.value;
        const statusElement = document.getElementById('currentPeriodInfo');
        const overdueCountElement = document.getElementById('overdueCustomersCount');

        console.log("🔄 updateCollectionPeriodStatus called with agentId:", agentId);
        console.log("📊 Elements found:", { agentSelect: !!agentSelect, statusElement: !!statusElement, overdueCountElement: !!overdueCountElement });

        if (!agentId || !statusElement || !overdueCountElement) {
            console.log("⚠️ Missing elements for updateCollectionPeriodStatus");
            return;
        }

        // Get current period info
        const { data: customers } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('agent_id', agentId);

        if (!customers) return;

        // Get collections for correct amounts
        const { data: collections } = await supabaseClient
            .from('collections')
            .select('*')
            .eq('collected_by', agentId);

        // Create a map of customer_id to collection amount
        const collectionAmounts = {};
        collections?.forEach(collection => {
            if (collection.customer_id) {
                const amount = collection.amount || collection.original_amount || collection.debt_amount || 0;
                collectionAmounts[collection.customer_id] = parseFloat(amount) || 0;
            }
        });

        // Process customers with collection amounts (same logic as modal)
        const processedCustomers = customers.map(customer => {
            const amount = calculateAmount(customer, collectionAmounts);
            return {
                ...customer,
                debt_amount: parseFloat(amount) || 0
            };
        });

        const totalCustomers = processedCustomers.length;
        const collectedCustomers = processedCustomers.filter(c => c.collection_status === 'تم التحصيل').length;
        const uncollectedCustomers = totalCustomers - collectedCustomers;
        const overdueCustomers = processedCustomers.filter(c => (c.overdue_periods || 0) > 0);

        // Calculate period statistics using processed customers
        const totalAmount = processedCustomers.reduce((sum, c) => sum + calculateAmount(c), 0);
        const collectedAmount = processedCustomers.filter(c => c.collection_status === 'تم التحصيل').reduce((sum, c) => sum + calculateAmount(c), 0);
        const collectionRate = totalCustomers > 0 ? ((collectedCustomers / totalCustomers) * 100).toFixed(1) : 0;

        // Update status display
        statusElement.innerHTML = `
            <strong>📊 إجمالي العملاء:</strong> ${totalCustomers} | 
            <strong>✅ تم التحصيل:</strong> ${collectedCustomers} | 
            <strong>⏳ لم يتم:</strong> ${uncollectedCustomers} | 
            <strong>📈 نسبة التحصيل:</strong> ${collectionRate}% | 
            <strong>💰 إجمالي المبلغ:</strong> ${totalAmount.toFixed(2)} ج.م
        `;

        overdueCountElement.textContent = overdueCustomers.length;

        // Add warning color if there are overdue customers
        if (overdueCustomers.length > 0) {
            overdueCountElement.style.color = '#dc3545';
            statusElement.style.color = '#ff6b35';
        }

    } catch (error) {
        console.error('Error updating collection period status:', error);
    }
};
