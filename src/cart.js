$(document).ready(function () {

    // ─────────────────────────────────────────────
    //  DATA
    // ─────────────────────────────────────────────
    const DELIVERY_FEE = 5.00;

    // Promo codes (add/edit as needed)
    const PROMO_CODES = {
        'PROMO10': { type: 'percent', value: 10, label: '10% de desconto' },
        'FRETE0':  { type: 'fixed',   value: 5,  label: 'Frete grátis' },
        'FOOD5':   { type: 'fixed',   value: 5,  label: 'R$5,00 de desconto' },
    };

    // Dish info — keeps in sync with your HTML cards
    const DISHES = [
        { id: 1, name: 'Hambúrguer Clássico', price: 20.00, img: 'src/images/dish.png'  },
        { id: 2, name: 'Batata Frita',         price: 20.00, img: 'src/images/dish2.png' },
        { id: 3, name: 'Hot Dog Especial',      price: 20.00, img: 'src/images/dish3.png' },
        { id: 4, name: 'Combo Supremo',         price: 20.00, img: 'src/images/dish4.png' },
    ];

    // ─────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────
    let cart        = [];   // [{ id, name, price, img, qty }]
    let appliedPromo = null; // { code, type, value, label } | null
    let trackingInterval = null;
    let trackingStep = 0;

    // ─────────────────────────────────────────────
    //  INJECT HTML STRUCTURES
    // ─────────────────────────────────────────────
    $('body').append(`

        <!-- Floating cart button -->
        <button id="cart-float-btn" title="Carrinho">
            <i class="fa-solid fa-basket-shopping"></i>
            <span id="cart-count-badge">0</span>
        </button>

        <!-- Sidebar overlay -->
        <div id="cart-overlay"></div>

        <!-- Cart sidebar -->
        <div id="cart-sidebar">
            <div id="cart-header">
                <h3><i class="fa-solid fa-basket-shopping"></i> Carrinho</h3>
                <button id="cart-close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="cart-items-container">
                <div id="cart-empty">
                    <i class="fa-solid fa-bowl-rice"></i>
                    <p>Seu carrinho está vazio.<br>Adicione itens do cardápio!</p>
                </div>
            </div>
            <div id="cart-footer" style="display:none">
                <div class="cart-row">
                    <span>Subtotal</span>
                    <span id="cart-subtotal">R$ 0,00</span>
                </div>
                <div class="cart-row">
                    <span>Taxa de entrega</span>
                    <span id="cart-delivery-fee">R$ 5,00</span>
                </div>
                <div class="cart-row" id="cart-discount-row" style="display:none;color:#2e7d32">
                    <span>Desconto</span>
                    <span id="cart-discount-val">-R$ 0,00</span>
                </div>
                <div class="cart-row total">
                    <span>Total</span>
                    <span id="cart-total">R$ 5,00</span>
                </div>
                <button class="btn-default" id="checkout-btn">
                    <i class="fa-solid fa-bag-shopping"></i>
                    Finalizar Pedido
                </button>
            </div>
        </div>

        <!-- ═══════ CHECKOUT MODAL ═══════ -->
        <div id="checkout-modal">
            <div id="checkout-box">

                <!-- Header -->
                <div class="modal-header">
                    <h3 id="modal-title">
                        <i class="fa-solid fa-clipboard-list"></i>
                        <span>Finalizar Pedido</span>
                    </h3>
                    <button class="modal-close-btn" id="modal-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Step dots -->
                <div id="step-indicator">
                    <div class="step-dot active" data-step="0"></div>
                    <div class="step-dot" data-step="1"></div>
                </div>

                <!-- ── STEP 0: Delivery form ── -->
                <div id="delivery-form">

                    <!-- Order summary mini -->
                    <div class="order-summary-mini">
                        <h4><i class="fa-solid fa-receipt"></i> Resumo do pedido</h4>
                        <div id="summary-items"></div>
                        <div class="summary-total">
                            <span>Total</span>
                            <span id="summary-total-val">R$ 0,00</span>
                        </div>
                    </div>

                    <!-- Name -->
                    <div class="form-group">
                        <label for="input-name"><i class="fa-solid fa-user"></i> Nome completo *</label>
                        <input type="text" id="input-name" placeholder="Seu nome completo">
                    </div>

                    <!-- Street + Number -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="input-street"><i class="fa-solid fa-road"></i> Rua *</label>
                            <input type="text" id="input-street" placeholder="Nome da rua">
                        </div>
                        <div class="form-group">
                            <label for="input-number"><i class="fa-solid fa-hashtag"></i> Número *</label>
                            <input type="text" id="input-number" placeholder="Ex: 123">
                        </div>
                    </div>

                    <!-- Neighborhood -->
                    <div class="form-group">
                        <label for="input-neighborhood"><i class="fa-solid fa-map-pin"></i> Bairro *</label>
                        <input type="text" id="input-neighborhood" placeholder="Seu bairro">
                    </div>

                    <!-- Apartment toggle -->
                    <label class="apt-toggle">
                        <input type="checkbox" id="apt-checkbox">
                        <span class="apt-toggle-visual"></span>
                        <span>É apartamento?</span>
                    </label>

                    <!-- Apt number (hidden until checked) -->
                    <div class="form-group" id="apt-number-field">
                        <label for="input-apt"><i class="fa-solid fa-building"></i> Número do apartamento</label>
                        <input type="text" id="input-apt" placeholder="Ex: Bloco B, Apto 302">
                    </div>

                    <!-- Promo -->
                    <div class="form-group">
                        <label><i class="fa-solid fa-tag"></i> Código promocional</label>
                        <div class="promo-row">
                            <input type="text" id="promo-input" placeholder="CÓDIGO PROMO">
                            <button id="promo-apply-btn">Aplicar</button>
                        </div>
                        <span id="promo-feedback"></span>
                    </div>

                    <!-- Payment -->
                    <div class="form-group">
                        <label><i class="fa-solid fa-credit-card"></i> Forma de pagamento *</label>
                        <div class="payment-options">
                            <label class="payment-option" id="pix-option">
                                <input type="radio" name="payment" value="pix">
                                <i class="fa-brands fa-pix"></i>
                                <span>Pix</span>
                            </label>
                            <label class="payment-option" id="card-option">
                                <input type="radio" name="payment" value="card">
                                <i class="fa-solid fa-credit-card"></i>
                                <span>Cartão</span>
                            </label>
                        </div>
                    </div>

                    <!-- Card fields (shown when card selected) -->
                    <div id="card-fields">
                        <div class="form-group">
                            <label>Número do cartão</label>
                            <input type="text" id="input-card-number" placeholder="0000 0000 0000 0000" maxlength="19">
                        </div>
                        <div class="form-group">
                            <label>Nome no cartão</label>
                            <input type="text" id="input-card-name" placeholder="Nome como está no cartão">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Validade</label>
                                <input type="text" id="input-card-expiry" placeholder="MM/AA" maxlength="5">
                            </div>
                            <div class="form-group">
                                <label>CVV</label>
                                <input type="text" id="input-card-cvv" placeholder="000" maxlength="4">
                            </div>
                        </div>
                    </div>

                    <!-- Submit -->
                    <button class="btn-default" id="form-submit-btn">
                        <i class="fa-solid fa-check"></i>
                        Confirmar Pedido
                    </button>
                </div>

                <!-- ── STEP 1: Tracking ── -->
                <div id="tracking-screen" style="display:none">
                    <div class="tracking-icon" id="tracking-emoji">🍔</div>

                    <h3>Pedido confirmado!</h3>
                    <p id="tracking-status-msg">Estamos preparando seu pedido com carinho.</p>

                    <!-- ETA -->
                    <div id="eta-box">
                        <i class="fa-solid fa-clock"></i>
                        <div class="eta-text">
                            <span>Previsão de entrega</span>
                            <strong id="eta-countdown">30 min</strong>
                        </div>
                    </div>

                    <!-- Steps -->
                    <div class="tracking-steps">
                        <div class="tracking-step active" id="ts-preparing">
                            <div class="step-icon-wrap">
                                <div class="step-circle"><i class="fa-solid fa-fire-burner"></i></div>
                                <div class="step-connector"></div>
                            </div>
                            <div class="step-info">
                                <h4>Sendo preparado</h4>
                                <p>Nosso chef está preparando seu pedido</p>
                                <span class="step-badge">Agora</span>
                            </div>
                        </div>

                        <div class="tracking-step" id="ts-ready">
                            <div class="step-icon-wrap">
                                <div class="step-circle"><i class="fa-solid fa-bell-concierge"></i></div>
                                <div class="step-connector"></div>
                            </div>
                            <div class="step-info">
                                <h4>Pedido pronto</h4>
                                <p>Embalado e pronto para sair</p>
                                <span class="step-badge">Em breve</span>
                            </div>
                        </div>

                        <div class="tracking-step" id="ts-delivering">
                            <div class="step-icon-wrap">
                                <div class="step-circle"><i class="fa-solid fa-motorcycle"></i></div>
                            </div>
                            <div class="step-info">
                                <h4>A caminho</h4>
                                <p>Nosso motoboy está indo até você!</p>
                                <span class="step-badge">A caminho</span>
                            </div>
                        </div>
                    </div>

                    <button class="btn-default" id="new-order-btn">
                        <i class="fa-solid fa-rotate-left"></i>
                        Fazer novo pedido
                    </button>
                </div>

            </div>
        </div>
    `);

    // ─────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────
    function fmt(val) {
        return 'R$ ' + val.toFixed(2).replace('.', ',');
    }

    function getSubtotal() {
        return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    function getDiscount(subtotal) {
        if (!appliedPromo) return 0;
        if (appliedPromo.type === 'percent') {
            return subtotal * (appliedPromo.value / 100);
        }
        if (appliedPromo.type === 'fixed') {
            return Math.min(appliedPromo.value, subtotal + DELIVERY_FEE);
        }
        return 0;
    }

    function getDeliveryFee() {
        if (appliedPromo && appliedPromo.type === 'fixed' && appliedPromo.value === DELIVERY_FEE) {
            return 0; // FRETE0 promo
        }
        return DELIVERY_FEE;
    }

    function getTotal() {
        const sub = getSubtotal();
        const discount = getDiscount(sub);
        const fee = getDeliveryFee();
        return Math.max(0, sub + fee - discount);
    }

    function getCartCount() {
        return cart.reduce((sum, i) => sum + i.qty, 0);
    }

    // ─────────────────────────────────────────────
    //  CART RENDERING
    // ─────────────────────────────────────────────
    function renderCart() {
        const container = $('#cart-items-container');
        container.empty();

        if (cart.length === 0) {
            container.append(`
                <div id="cart-empty">
                    <i class="fa-solid fa-bowl-rice"></i>
                    <p>Seu carrinho está vazio.<br>Adicione itens do cardápio!</p>
                </div>
            `);
            $('#cart-footer').hide();
            return;
        }

        cart.forEach(item => {
            container.append(`
                <div class="cart-item" data-id="${item.id}">
                    <img class="cart-item-img" src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${fmt(item.price)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn minus-btn" data-id="${item.id}">−</button>
                        <span class="qty-number">${item.qty}</span>
                        <button class="qty-btn plus-btn" data-id="${item.id}">+</button>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}" title="Remover">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `);
        });

        // Totals
        const sub      = getSubtotal();
        const discount = getDiscount(sub);
        const fee      = getDeliveryFee();

        $('#cart-subtotal').text(fmt(sub));
        $('#cart-delivery-fee').text(fee === 0 ? 'Grátis 🎉' : fmt(fee));

        if (discount > 0) {
            $('#cart-discount-row').show();
            $('#cart-discount-val').text('−' + fmt(discount));
        } else {
            $('#cart-discount-row').hide();
        }

        $('#cart-total').text(fmt(getTotal()));
        $('#cart-footer').show();

        // Count badge
        updateBadge();
    }

    function updateBadge() {
        const count = getCartCount();
        const badge = $('#cart-count-badge');
        badge.text(count);
        if (count > 0) {
            badge.addClass('visible');
        } else {
            badge.removeClass('visible');
        }
    }

    // ─────────────────────────────────────────────
    //  ADD / REMOVE / QUANTITY
    // ─────────────────────────────────────────────
    function addToCart(dish) {
        const existing = cart.find(i => i.id === dish.id);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ ...dish, qty: 1 });
        }
        renderCart();
    }

    function removeFromCart(id) {
        cart = cart.filter(i => i.id !== id);
        renderCart();
    }

    function changeQty(id, delta) {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        renderCart();
    }

    // ─────────────────────────────────────────────
    //  SIDEBAR OPEN / CLOSE
    // ─────────────────────────────────────────────
    function openCart() {
        $('#cart-sidebar, #cart-overlay').addClass('active');
        $('body').css('overflow', 'hidden');
    }

    function closeCart() {
        $('#cart-sidebar, #cart-overlay').removeClass('active');
        $('body').css('overflow', '');
    }

    // ─────────────────────────────────────────────
    //  CHECKOUT MODAL
    // ─────────────────────────────────────────────
    function openCheckoutModal() {
        closeCart();
        renderSummary();
        $('#delivery-form').show();
        $('#tracking-screen').hide();
        goToStep(0);
        $('#checkout-modal').addClass('active');
        $('body').css('overflow', 'hidden');
    }

    function closeCheckoutModal() {
        $('#checkout-modal').removeClass('active');
        $('body').css('overflow', '');
        // Stop tracking simulation if running
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
        }
    }

    function goToStep(step) {
        $('.step-dot').removeClass('active done');
        for (let i = 0; i < step; i++) $(`.step-dot[data-step="${i}"]`).addClass('done');
        $(`.step-dot[data-step="${step}"]`).addClass('active');
    }

    function renderSummary() {
        const container = $('#summary-items');
        container.empty();
        cart.forEach(item => {
            container.append(`
                <div class="summary-item">
                    <span>${item.qty}× ${item.name}</span>
                    <span>${fmt(item.price * item.qty)}</span>
                </div>
            `);
        });
        const sub      = getSubtotal();
        const discount = getDiscount(sub);
        const fee      = getDeliveryFee();

        if (fee > 0) {
            container.append(`
                <div class="summary-item">
                    <span>Taxa de entrega</span>
                    <span>${fmt(fee)}</span>
                </div>
            `);
        } else {
            container.append(`
                <div class="summary-item" style="color:#2e7d32">
                    <span>Taxa de entrega</span>
                    <span>Grátis 🎉</span>
                </div>
            `);
        }
        if (discount > 0) {
            container.append(`
                <div class="summary-item" style="color:#2e7d32">
                    <span>Desconto</span>
                    <span>−${fmt(discount)}</span>
                </div>
            `);
        }
        $('#summary-total-val').text(fmt(getTotal()));
    }

    // ─────────────────────────────────────────────
    //  PROMO CODE
    // ─────────────────────────────────────────────
    function applyPromo(code) {
        const feedback = $('#promo-feedback');
        const promo = PROMO_CODES[code.toUpperCase()];
        if (promo) {
            appliedPromo = { code: code.toUpperCase(), ...promo };
            feedback.removeClass('error').addClass('success').text('✓ ' + promo.label + ' aplicado!');
            renderCart();
            renderSummary();
        } else {
            appliedPromo = null;
            feedback.removeClass('success').addClass('error').text('✗ Código inválido.');
            renderCart();
            renderSummary();
        }
    }

    // ─────────────────────────────────────────────
    //  FORM VALIDATION + SUBMIT
    // ─────────────────────────────────────────────
    function validateForm() {
        const name    = $('#input-name').val().trim();
        const street  = $('#input-street').val().trim();
        const number  = $('#input-number').val().trim();
        const neighborhood = $('#input-neighborhood').val().trim();
        const payment = $('input[name="payment"]:checked').val();

        if (!name) { alert('Por favor, informe seu nome.'); $('#input-name').focus(); return false; }
        if (!street) { alert('Por favor, informe a rua.'); $('#input-street').focus(); return false; }
        if (!number) { alert('Por favor, informe o número.'); $('#input-number').focus(); return false; }
        if (!neighborhood) { alert('Por favor, informe o bairro.'); $('#input-neighborhood').focus(); return false; }
        if (!payment) { alert('Por favor, selecione uma forma de pagamento.'); return false; }

        if (payment === 'card') {
            const cardNum  = $('#input-card-number').val().replace(/\s/g, '');
            const cardName = $('#input-card-name').val().trim();
            const expiry   = $('#input-card-expiry').val().trim();
            const cvv      = $('#input-card-cvv').val().trim();
            if (cardNum.length < 13) { alert('Número de cartão inválido.'); return false; }
            if (!cardName) { alert('Informe o nome no cartão.'); return false; }
            if (!/^\d{2}\/\d{2}$/.test(expiry)) { alert('Validade inválida. Use MM/AA.'); return false; }
            if (cvv.length < 3) { alert('CVV inválido.'); return false; }
        }

        return true;
    }

    // ─────────────────────────────────────────────
    //  TRACKING SIMULATION
    // ─────────────────────────────────────────────
    const TRACKING_EMOJIS = ['🍔', '🔥', '🍟', '🏍️', '🛵'];
    const TRACKING_MSGS = [
        'Estamos preparando seu pedido com carinho.',
        'Quase pronto! Finalindo os detalhes.',
        'Pedido pronto! Embalando para entrega.',
        'Nosso motoboy está a caminho!',
        'Chegando aí! Aguarde na porta. 🎉',
    ];

    function startTracking() {
        trackingStep = 0;
        let etaMinutes = 30;

        updateTrackingUI();

        trackingInterval = setInterval(function () {
            trackingStep++;
            etaMinutes -= 10;
            if (etaMinutes < 0) etaMinutes = 0;

            updateTrackingUI();
            updateEta(etaMinutes);

            if (trackingStep >= 2) {
                clearInterval(trackingInterval);
                trackingInterval = null;
                // Final arrived state
                setTimeout(function () {
                    trackingStep = 3;
                    $('#tracking-emoji').text('🎉');
                    $('#tracking-status-msg').text('Pedido entregue! Bom apetite! 🍽️');
                    $('#eta-countdown').text('Entregue!');
                }, 8000);
            }
        }, 8000); // Each step takes 8 seconds (demo speed)
    }

    function updateTrackingUI() {
        const steps = ['#ts-preparing', '#ts-ready', '#ts-delivering'];
        const emojiList = ['🍔', '🔔', '🏍️'];
        const msgList = [
            'Estamos preparando seu pedido com carinho.',
            'Pedido pronto! Sendo embalado para entrega.',
            'Nosso motoboy está a caminho! 🏍️',
        ];

        steps.forEach((sel, i) => {
            const el = $(sel);
            el.removeClass('active done');
            if (i < trackingStep) el.addClass('done');
            else if (i === trackingStep) el.addClass('active');
        });

        if (emojiList[trackingStep]) {
            $('#tracking-emoji').text(emojiList[trackingStep]);
        }
        if (msgList[trackingStep]) {
            $('#tracking-status-msg').text(msgList[trackingStep]);
        }
    }

    function updateEta(minutes) {
        $('#eta-countdown').text(minutes > 0 ? minutes + ' min' : 'Chegando!');
    }

    // ─────────────────────────────────────────────
    //  EVENTS — Cart sidebar
    // ─────────────────────────────────────────────
    $('#cart-float-btn').on('click', openCart);
    $('#cart-close-btn, #cart-overlay').on('click', closeCart);

    // Dish "add to cart" buttons
    $(document).on('click', '.dish .btn-default', function () {
        const dish = $(this).closest('.dish');
        // Figure out which dish by position (1-indexed)
        const index = $('.dish').index(dish);
        const data  = DISHES[index];
        if (!data) return;

        addToCart(data);

        // Visual feedback
        const btn = $(this);
        const feedback = $('<span class="add-feedback"><i class="fa-solid fa-check"></i></span>');
        btn.append(feedback);
        setTimeout(() => feedback.remove(), 600);
    });

    // Quantity controls
    $(document).on('click', '.plus-btn', function () {
        const id = parseInt($(this).data('id'));
        changeQty(id, 1);
    });

    $(document).on('click', '.minus-btn', function () {
        const id = parseInt($(this).data('id'));
        changeQty(id, -1);
    });

    $(document).on('click', '.cart-item-remove', function () {
        const id = parseInt($(this).data('id'));
        removeFromCart(id);
    });

    // Checkout
    $('#checkout-btn').on('click', function () {
        if (cart.length === 0) return;
        openCheckoutModal();
    });

    // ─────────────────────────────────────────────
    //  EVENTS — Checkout modal
    // ─────────────────────────────────────────────
    $('#modal-close-btn').on('click', closeCheckoutModal);

    // Close modal clicking outside box
    $('#checkout-modal').on('click', function (e) {
        if ($(e.target).is('#checkout-modal')) closeCheckoutModal();
    });

    // Apartment toggle
    $('#apt-checkbox').on('change', function () {
        if ($(this).is(':checked')) {
            $('#apt-number-field').addClass('visible');
        } else {
            $('#apt-number-field').removeClass('visible');
            $('#input-apt').val('');
        }
    });

    // Payment options style
    $('input[name="payment"]').on('change', function () {
        $('.payment-option').removeClass('selected');
        $(this).closest('.payment-option').addClass('selected');
        if ($(this).val() === 'card') {
            $('#card-fields').addClass('visible');
        } else {
            $('#card-fields').removeClass('visible');
        }
    });

    // Card number auto-format
    $('#input-card-number').on('input', function () {
        let val = $(this).val().replace(/\D/g, '').substring(0, 16);
        val = val.match(/.{1,4}/g)?.join(' ') || val;
        $(this).val(val);
    });

    // Card expiry auto-format
    $('#input-card-expiry').on('input', function () {
        let val = $(this).val().replace(/\D/g, '').substring(0, 4);
        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
        $(this).val(val);
    });

    // Promo apply
    $('#promo-apply-btn').on('click', function () {
        const code = $('#promo-input').val().trim();
        if (!code) {
            $('#promo-feedback').removeClass('success').addClass('error').text('Digite um código.');
            return;
        }
        applyPromo(code);
    });

    $('#promo-input').on('keypress', function (e) {
        if (e.key === 'Enter') $('#promo-apply-btn').trigger('click');
    });

    // Submit order
    $('#form-submit-btn').on('click', function () {
        if (!validateForm()) return;

        // Transition to tracking
        goToStep(1);
        $('#modal-title span').text('Acompanhar Pedido');
        $('#modal-title i').attr('class', 'fa-solid fa-motorcycle');

        $('#delivery-form').fadeOut(200, function () {
            $('#tracking-screen').fadeIn(300);
            startTracking();
        });

        // Clear cart
        cart = [];
        appliedPromo = null;
        renderCart();
    });

    // New order
    $('#new-order-btn').on('click', function () {
        closeCheckoutModal();
        // Reset form
        $('#delivery-form')[0].reset();
        $('#apt-number-field').removeClass('visible');
        $('#card-fields').removeClass('visible');
        $('.payment-option').removeClass('selected');
        $('#promo-feedback').text('');
        appliedPromo = null;
    });
    
    // Header "Peça aqui" button → scroll to menu
    $('header .btn-default').first().on('click', function () {
        $('html, body').animate({ scrollTop: $('#menu').offset().top - 91 }, 600);
    });

    // ─────────────────────────────────────────────
    //  INITIAL RENDER
    // ─────────────────────────────────────────────
    renderCart();
});