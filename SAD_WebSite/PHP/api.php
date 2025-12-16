<?php
error_reporting(E_ALL);

ob_start(); // Start output buffering to catch unexpected output

header('Content-Type: application/json');
require_once 'db.php';

// funcao ajuda para obter entrada JSON em seguranca
function getJsonInput() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }
    return $data;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'saveRecommendation':
            saveRecommendation();
            break;
        case 'saveFeedback':
            saveFeedback();
            break;
        case 'getHistorico':
            getHistorico();
            break;
        case 'getCriterios':
            getCriterios();
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

ob_end_flush(); // envia buffer saida

function getCriterios() {
    global $pdo;
    try {
        $stmt = $pdo->query('SELECT id, nome FROM criterios');
        $criterios = $stmt->fetchAll();

        // descodifica JSON dos nomes criterios para array
        foreach ($criterios as &$criterio) {
            $decoded = json_decode($criterio['nome']);
            $criterio['criteriaArray'] = is_array($decoded) ? $decoded : [$criterio['nome']];
        }

        echo json_encode(['success' => true, 'criterios' => $criterios]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao obter criterios: ' . $e->getMessage()]);
    }
}

function saveRecommendation() {
    global $pdo;
    try {
        $data = getJsonInput();

        if (empty($data['local']) || empty($data['criterios']) || !array_key_exists('feedback', $data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        $local = $data['local'];
        $criterios = $data['criterios']; // array criterios
        $feedbackText = $data['feedback'];
        $advFilters = $data['advancedFilters'] ?? null;

        $criteriosJson = json_encode($criterios);

        $pdo->beginTransaction();

        // insere recomendacao
        $stmt = $pdo->prepare('INSERT INTO recomendacoes (local) VALUES (?)');
        $stmt->execute([$local]);
        $recomendacao_id = $pdo->lastInsertId();

        $fAvancados_id = null;

        // insere filtros avancados se existir
        if ($advFilters && (
            ($advFilters['orcamentoMin'] ?? '') !== '' ||
            ($advFilters['orcamentoMax'] ?? '') !== '' ||
            (!empty($advFilters['tiposCarro'])) ||
            ($advFilters['faixaEtaria'] ?? '') !== '' ||
            ($advFilters['nivelRendimento'] ?? '') !== ''
        )) {
            $tipos_carro_str = null;
            if (!empty($advFilters['tiposCarro']) && is_array($advFilters['tiposCarro'])) {
                $tipos_carro_str = implode(',', $advFilters['tiposCarro']);
            }
            $stmt = $pdo->prepare('INSERT INTO fAvancados (orcamento_min, orcamento_max, tipos_carro, faixa_etaria, nivel_rendimento) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $advFilters['orcamentoMin'] ?? null,
                $advFilters['orcamentoMax'] ?? null,
                $tipos_carro_str,
                $advFilters['faixaEtaria'] ?? null,
                $advFilters['nivelRendimento'] ?? null
            ]);
            $fAvancados_id = $pdo->lastInsertId();
        }

        // insere ou obtem criterios
        $stmt = $pdo->prepare('SELECT id FROM criterios WHERE nome = ?');
        $stmt->execute([$criteriosJson]);
        $criterio = $stmt->fetch();

        if ($criterio) {
            $criterio_id = $criterio['id'];
        } else {
            $stmt = $pdo->prepare('INSERT INTO criterios (nome) VALUES (?)');
            $stmt->execute([$criteriosJson]);
            $criterio_id = $pdo->lastInsertId();
        }

        // conversao Feedback
        $feedbackValue = null;
        if (is_string($feedbackText)) {
            if (strcasecmp($feedbackText, 'Sim') === 0) {
                $feedbackValue = 1;
            } elseif (strcasecmp($feedbackText, 'Não') === 0) {
                $feedbackValue = 0;
            }
        } elseif (is_null($feedbackText)) {
            $feedbackValue = null;
        }

        // insere ou atualiza feedback
        $stmt = $pdo->prepare('SELECT id FROM feedbacks WHERE recomendacao_id = ? AND criterio_id = ?');
        $stmt->execute([$recomendacao_id, $criterio_id]);
        $existingFeedback = $stmt->fetch();

        if ($existingFeedback) {
            $stmt = $pdo->prepare('UPDATE feedbacks SET feedback = ?, fAvancados_id = ? WHERE id = ?');
            $stmt->execute([$feedbackValue, $fAvancados_id, $existingFeedback['id']]);
            $feedback_id = $existingFeedback['id'];
        } else {
            $stmt = $pdo->prepare('INSERT INTO feedbacks (recomendacao_id, criterio_id, feedback, fAvancados_id) VALUES (?, ?, ?, ?)');
            $stmt->execute([$recomendacao_id, $criterio_id, $feedbackValue, $fAvancados_id]);
            $feedback_id = $pdo->lastInsertId();
        }

        $pdo->commit();
        echo json_encode([
            'success' => true,
            'message' => 'Recomendação salva com sucesso',
            'recomendacao_id' => $recomendacao_id,
            'criterio_id' => $criterio_id,
            'feedback_id' => $feedback_id
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao salvar recomendação: ' . $e->getMessage()]);
    }
}

function saveFeedback() {
    global $pdo;
    try {
        $data = getJsonInput();

        if (!isset($data['feedback']) || (empty($data['feedback_id']) && (empty($data['recomendacao_id']) || empty($data['criterio_id'])))) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        $feedbackValue = $data['feedback'] ? 1 : 0;

        if (!empty($data['feedback_id'])) {
            $feedback_id = $data['feedback_id'];
            // atualizar com feedback id
            $stmt = $pdo->prepare('UPDATE feedbacks SET feedback = ? WHERE id = ?');
            $stmt->execute([$feedbackValue, $feedback_id]);
        } else {
            $recomendacao_id = $data['recomendacao_id'];
            $criterio_id = $data['criterio_id'];

            // verifica se feedback existe
            $stmt = $pdo->prepare('SELECT id FROM feedbacks WHERE recomendacao_id = ? AND criterio_id = ?');
            $stmt->execute([$recomendacao_id, $criterio_id]);
            $existingFeedback = $stmt->fetch();

            if ($existingFeedback) {
                $stmt = $pdo->prepare('UPDATE feedbacks SET feedback = ? WHERE id = ?');
                $stmt->execute([$feedbackValue, $existingFeedback['id']]);
            } else {
                $stmt = $pdo->prepare('INSERT INTO feedbacks (recomendacao_id, criterio_id, feedback) VALUES (?, ?, ?)');
                $stmt->execute([$recomendacao_id, $criterio_id, $feedbackValue]);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Feedback salvo com sucesso']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao salvar feedback: ' . $e->getMessage()]);
    }
}

function getHistorico() {
    global $pdo;

    try {
        $stmt = $pdo->query('
            SELECT r.id AS recomendacao_id, r.local, r.data,
                   c.nome AS criterio_nome,
                   f.feedback
            FROM recomendacoes r
            LEFT JOIN feedbacks f ON r.id = f.recomendacao_id
            LEFT JOIN criterios c ON f.criterio_id = c.id
            ORDER BY r.data DESC
        ');

        $rows = $stmt->fetchAll();

        // agrupar dados por recomendacao id
        $historico = [];
        foreach ($rows as $row) {
            $recId = $row['recomendacao_id'];
            if (!isset($historico[$recId])) {
                $criteriosDecoded = json_decode($row['criterio_nome'], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $criteriosDecoded = [$row['criterio_nome']];
                }
                $historico[$recId] = [
                    'local' => $row['local'],
                    'data' => $row['data'],
                    'criterios' => $criteriosDecoded,
                    'feedback' => null
                ];
            }
            if ($row['criterio_nome']) {
                if ($historico[$recId]['feedback'] === null && $row['feedback'] !== null) {
                    $historico[$recId]['feedback'] = $row['feedback'] == 1 ? 'Sim' : 'Não';
                }
            }
        }

        // converter array associativo para indexado
        $historicoList = array_values($historico);

        echo json_encode(['success' => true, 'historico' => $historicoList]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao obter histórico: ' . $e->getMessage()]);
    }
}
?>
