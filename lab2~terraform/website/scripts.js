// Configuration injectée par Terraform (templatefile)
var API_ENDPOINT = "${api_endpoint}";
var USER = "${user_name}";

(function () {
  var form = document.getElementById("convert-form");
  var btnConvert = document.getElementById("btn-convert");
  var btnRefresh = document.getElementById("btn-refresh");
  var statusMsg = document.getElementById("status-msg");
  var postsList = document.getElementById("posts-list");

  function showStatus(msg, isError) {
    statusMsg.textContent = msg;
    statusMsg.hidden = false;
    statusMsg.className = "status" + (isError ? " error" : "");
  }

  // --- Conversion POST ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var voice = document.getElementById("voice").value;
    var text = document.getElementById("text-input").value.trim();
    if (!text) return;

    btnConvert.disabled = true;
    showStatus("Envoi en cours...", false);

    fetch(API_ENDPOINT + "/" + USER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice: voice, text: text, user: USER }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        showStatus("Conversion lancée ! ID : " + data, false);
        document.getElementById("text-input").value = "";
        btnConvert.disabled = false;
      })
      .catch(function (err) {
        showStatus("Erreur : " + err.message, true);
        btnConvert.disabled = false;
      });
  });

  // --- Récupération GET ---
  function loadPosts() {
    fetch(API_ENDPOINT + "/" + USER + "?postId=*&user=" + USER)
      .then(function (res) { return res.json(); })
      .then(function (items) {
        if (!items || items.length === 0) {
          postsList.innerHTML = '<p class="empty">Aucune conversion pour le moment.</p>';
          return;
        }
        var html = "";
        items.forEach(function (item) {
          var badge = item.status === "UPDATED"
            ? '<span class="badge updated">Prêt</span>'
            : '<span class="badge processing">En cours</span>';
          var audio = item.url
            ? '<audio controls src="' + item.url + '"></audio>'
            : "";
          html += '<div class="post-item">'
            + '<div class="meta">' + badge + " · " + item.voice + " · <code>" + item.id + "</code></div>"
            + '<p class="text-preview">' + escapeHtml(item.text) + "</p>"
            + audio
            + "</div>";
        });
        postsList.innerHTML = html;
      })
      .catch(function (err) {
        postsList.innerHTML = '<p class="empty error">Erreur de chargement.</p>';
      });
  }

  btnRefresh.addEventListener("click", loadPosts);

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // Chargement initial
  loadPosts();
})();
