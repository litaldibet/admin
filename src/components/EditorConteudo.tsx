import { useState } from "react";

function EditorConteudo() {
  const [texto, setTexto] = useState("");

  function handleInput(event: any) {
    setTexto(event.target.innerHTML);
  }

  return (
    <div>
      <h2>Editar Conteúdo</h2>

      <div
        contentEditable={true}
        onInput={handleInput}
        style={{
          border: "1px solid black",
          minHeight: "300px",
          padding: "10px"
        }}></div>

      <p>Conteúdo atual:</p>
      
      <div>{texto}</div>
    </div>
  );
}

export default EditorConteudo;
