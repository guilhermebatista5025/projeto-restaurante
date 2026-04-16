      $(document).ready(function () {

        /* ---------- MOBILE MENU ---------- */
        $('#mobile_btn').on('click', function () {
          $('#mobile_menu').toggleClass('active');
          $(this).find('i').toggleClass('fa-x');
        });

        /* ---------- CONTAGEM DE ITENS ---------- */
        function updateCount(category) {
          const total = category === 'todos'
            ? $('.dish').length
            : $('.dish[data-category="' + category + '"]').length;

          $('#item-count').text(total + ' ' + (total === 1 ? 'item encontrado' : 'itens encontrados'));
        }

        /* ---------- FILTRO ---------- */
        $('#filter-bar').on('click', '.filter-btn', function () {
          const category = $(this).data('category');

          // Atualiza botão ativo
          $('.filter-btn').removeClass('active');
          $(this).addClass('active');

          if (category === 'todos') {
            // Mostra tudo
            $('.category-section').removeClass('hidden');
          } else {
            // Mostra só a seção correspondente
            $('.category-section').each(function () {
              const sectionCat = $(this).data('cat');
              if (sectionCat === category) {
                $(this).removeClass('hidden');
              } else {
                $(this).addClass('hidden');
              }
            });
          }

          updateCount(category);

          // Scroll suave para o topo do grid
          $('html, body').animate(
            { scrollTop: $('#menu-grid').offset().top - 160 },
            300
          );
        });

        // Inicializa contagem
        updateCount('todos');
      });