// src/frontend/renderer.jsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Helper: retorna a união (set) de chaves de um array de objetos, em ordem estável.
 */
function getUnionOfKeysFromItems(itemsArray) {
  const seenKeys = new Set();
  const orderedKeys = [];
  for (const item of itemsArray) {
    Object.keys(item).forEach((key) => {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        orderedKeys.push(key);
      }
    });
  }
  return orderedKeys;
}

const App = () => {
  const [stationRecords, setStationRecords] = useState([]);
  const [selectedStationRecord, setSelectedStationRecord] = useState(null);
  const [jsonTextAreaValue, setJsonTextAreaValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Carrega todas as estações salvas no banco
  async function loadAllStations() {
    try {
      setIsLoading(true);
      const response = await window.backendApi.getAllStations();
      if (response && response.success) {
        setStationRecords(response.payload || []);
      } else {
        setFeedbackMessage(response?.error ?? "Falha ao buscar estações");
      }
    } catch (error) {
      setFeedbackMessage(String(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAllStations();
  }, []);

  // Lê arquivo JSON selecionado pelo usuário
  function handleFileInputChange(event) {
    const inputFiles = event.target.files;
    if (!inputFiles || inputFiles.length === 0) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = (loadEvent) => {
      const textContent = loadEvent.target.result;
      setJsonTextAreaValue(String(textContent));
    };
    fileReader.readAsText(inputFiles[0]);
  }

  // Envia o JSON para o backend salvar
  async function handleSaveJsonToBackend() {
    setFeedbackMessage(null);
    try {
      const parsedObject = JSON.parse(jsonTextAreaValue);
      // Validacao minima
      if (!parsedObject || typeof parsedObject.codigo_estacao !== "string" || !Array.isArray(parsedObject.items)) {
        setFeedbackMessage("JSON inválido. Deve conter 'codigo_estacao' (string) e 'items' (array).");
        return;
      }
      setIsLoading(true);
      const saveResponse = await window.backendApi.saveStationJson(parsedObject);
      if (saveResponse && saveResponse.success) {
        setFeedbackMessage(saveResponse.message ?? "Salvo com sucesso.");
        // Recarrega lista e limpa seleção
        await loadAllStations();
        setSelectedStationRecord(null);
      } else {
        setFeedbackMessage(saveResponse?.error ?? "Erro ao salvar no backend.");
      }
    } catch (error) {
      setFeedbackMessage("Erro ao parsear JSON: " + String(error));
    } finally {
      setIsLoading(false);
    }
  }

  // Seleciona uma estação e prepara os dados para exibir
  function handleSelectStation(record) {
    setSelectedStationRecord(record);
    setFeedbackMessage(null);
  }

  // Renderiza a planilha (tabela) para os items da estação selecionada
  function renderSpreadsheetForSelectedStation() {
    if (!selectedStationRecord) {
      return <div>Selecione uma estação para ver a planilha.</div>;
    }

    let parsedPayload = null;
    try {
      parsedPayload = JSON.parse(selectedStationRecord.data);
    } catch (error) {
      return <div>Erro ao parsear os dados da estação: {String(error)}</div>;
    }

    const itemsArray = Array.isArray(parsedPayload.items) ? parsedPayload.items : [];
    if (itemsArray.length === 0) {
      return <div>Esta estação não possui items para exibir.</div>;
    }

    const columnKeys = getUnionOfKeysFromItems(itemsArray);

    return (
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columnKeys.map((columnKey) => (
                <th key={columnKey} style={{ borderBottom: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  {columnKey}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itemsArray.map((itemRow, rowIndex) => (
              <tr key={rowIndex}>
                {columnKeys.map((columnKey) => {
                  const cellValue = itemRow[columnKey] ?? "";
                  // Mostrar números como estão; não forçamos conversão para evitar assumir formato
                  return (
                    <td key={columnKey} style={{ padding: 8, verticalAlign: 'top', borderBottom: '1px solid #f3f3f3' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{String(cellValue)}</pre>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Importar e Exibir Estação (Planilha)</h1>

      <section style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Cole o JSON aqui (ou carregue um arquivo .json):</label>
        <textarea
          value={jsonTextAreaValue}
          onChange={(e) => setJsonTextAreaValue(e.target.value)}
          rows={12}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <input type="file" accept=".json,application/json" onChange={handleFileInputChange} />
          <button onClick={handleSaveJsonToBackend} disabled={isLoading}>Salvar no banco</button>
          <button onClick={loadAllStations} disabled={isLoading}>Recarregar estações</button>
        </div>
        {feedbackMessage && <div style={{ marginTop: 8, color: 'darkred' }}>{feedbackMessage}</div>}
      </section>

      <section style={{ display: 'flex', gap: 20 }}>
        <aside style={{ width: 300 }}>
          <h2>Estações salvas</h2>
          {isLoading ? (
            <div>Carregando...</div>
          ) : (
            <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
              {stationRecords.map((record) => (
                <li key={record.id} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => handleSelectStation(record)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 8,
                      background: selectedStationRecord && selectedStationRecord.id === record.id ? '#eef' : '#fff',
                      border: '1px solid #ddd',
                      cursor: 'pointer'
                    }}
                  >
                    {record.name} (id: {record.id})
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main style={{ flex: 1 }}>
          <h2>Planilha</h2>
          {renderSpreadsheetForSelectedStation()}
        </main>
      </section>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
