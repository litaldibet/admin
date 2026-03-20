import InputLabel from "./InputLabel";
import "../assets/css/FormPanel.css";

export default function FormPanel() {
  return (
    <div className="form-panel">
      <section className="form-panel-top">
        <section className="form-panel-image-list"></section>
        <button className="form-panel-button add_images">Adicionar imagens</button>
      </section>

      <section className="form-panel-bottom">
        <InputLabel value="Tipo" />
        <select name="type" id="type" multiple={false} className="form-panel-select">
          <option value="POST">Post</option>
          <option value="PROMOTION">Promocao</option>
        </select>

        <InputLabel value="Titulo" />
        <input type="text" className="form-panel-input-text"></input>

        <InputLabel value="Imagem do card" />
        <input type="file" className="form-panel-input-file"></input>

        <InputLabel value="Previa" />
        <textarea className="form-panel-preview"></textarea>
      </section>
    </div>
  );
}
