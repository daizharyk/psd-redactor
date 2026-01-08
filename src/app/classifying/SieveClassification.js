
// SoilClassifier.jsx
import { useState } from 'react';
import styles from './page.module.css';

export default function SoilClassifier() {
  const [inputs, setInputs] = useState({
    sandPercent: '',
    gravelPercent: '',
    finesPercent: '',
    cu: '',
    cc: '',
    finesType: '',
    gravelContent: ''
  });

  const [result, setResult] = useState(null);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const classifySoil = () => {
    const sand = parseFloat(inputs.sandPercent) || 0;
    const gravel = parseFloat(inputs.gravelPercent) || 0;
    const fines = parseFloat(inputs.finesPercent) || 0;
    const cu = parseFloat(inputs.cu) || 0;
    const cc = parseFloat(inputs.cc) || 0;
    const finesType = inputs.finesType;
    const gravelPct = parseFloat(inputs.gravelContent) || 0;

    if (sand + gravel <= 50) {
      setResult({ error: 'Этот классификатор только для крупнозернистых грунтов (песок + гравий > 50%)' });
      return;
    }

    let classification = '';

    if (sand > gravel) {
      if (fines < 5) {
        if (cu >= 6.0 && cc >= 1.0 && cc <= 3.0) {
          classification = gravelPct < 15 ? 'SW - Well-graded sand' : 'SW - Well-graded sand with gravel';
        } else {
          classification = gravelPct < 15 ? 'SP - Poorly graded sand' : 'SP - Poorly graded sand with gravel';
        }
      } else if (fines >= 5 && fines <= 12) {
        if (cu >= 6.0 && cc >= 1.0 && cc <= 3.0) {
          if (finesType === 'ML' || finesType === 'MH') {
            classification = gravelPct < 15 ? 'SW-SM - Well-graded sand with silt' : 'SW-SM - Well-graded sand with silt and gravel';
          } else if (finesType === 'CL' || finesType === 'CH' || finesType === 'CL-ML') {
            classification = gravelPct < 15 ? 'SW-SC - Well-graded sand with clay (or silty clay)' : 'SW-SC - Well-graded sand with clay and gravel (or silty clay and gravel)';
          }
        } else {
          if (finesType === 'ML' || finesType === 'MH') {
            classification = gravelPct < 15 ? 'SP-SM - Poorly graded sand with silt' : 'SP-SM - Poorly graded sand with silt and gravel';
          } else if (finesType === 'CL' || finesType === 'CH' || finesType === 'CL-ML') {
            classification = gravelPct < 15 ? 'SP-SC - Poorly graded sand with clay (or silty clay)' : 'SP-SC - Poorly graded sand with clay and gravel (or silty clay and gravel)';
          }
        }
      } else if (fines > 12) {
        if (finesType === 'ML' || finesType === 'MH') {
          classification = gravelPct < 15 ? 'SM - Silty sand' : 'SM - Silty sand with gravel';
        } else if (finesType === 'CL' || finesType === 'CH') {
          classification = gravelPct < 15 ? 'SC - Clayey sand' : 'SC - Clayey sand with gravel';
        } else if (finesType === 'CL-ML') {
          classification = gravelPct < 15 ? 'SC-SM - Silty, clayey sand' : 'SC-SM - Silty, clayey sand with gravel';
        }
      }
    } else {
      classification = 'Классификация гравийных грунтов (в разработке)';
    }

    setResult({ classification });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>ASTM D2487-17 Soil Classifier</h1>
        <p className={styles.subtitle}>Классификация крупнозернистых грунтов</p>

        <div className={styles.formSection}>
          <div className={styles.gridThree}>
            <div>
              <label className={styles.label}>% Песка</label>
              <input
                type="number"
                step="0.1"
                value={inputs.sandPercent}
                onChange={(e) => handleInputChange('sandPercent', e.target.value)}
                className={styles.input}
                placeholder="0-100"
              />
            </div>
            <div>
              <label className={styles.label}>% Гравия</label>
              <input
                type="number"
                step="0.1"
                value={inputs.gravelPercent}
                onChange={(e) => handleInputChange('gravelPercent', e.target.value)}
                className={styles.input}
                placeholder="0-100"
              />
            </div>
            <div>
              <label className={styles.label}>% Мелких частиц (fines)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.finesPercent}
                onChange={(e) => handleInputChange('finesPercent', e.target.value)}
                className={styles.input}
                placeholder="0-100"
              />
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div>
              <label className={styles.label}>
                C<sub>u</sub> (Коэффициент неоднородности)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.cu}
                onChange={(e) => handleInputChange('cu', e.target.value)}
                className={styles.input}
                placeholder="≥ 0"
              />
            </div>
            <div>
              <label className={styles.label}>
                C<sub>c</sub> (Коэффициент кривизны)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
                className={styles.input}
                placeholder="≥ 0"
              />
            </div>
          </div>

          {parseFloat(inputs.finesPercent) >= 5 && (
            <>
              <div>
                <label className={styles.label}>Тип мелких частиц</label>
                <select
                  value={inputs.finesType}
                  onChange={(e) => handleInputChange('finesType', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Выберите тип</option>
                  <option value="ML">ML (Ил низкой пластичности)</option>
                  <option value="MH">MH (Ил высокой пластичности)</option>
                  <option value="CL">CL (Глина низкой пластичности)</option>
                  <option value="CH">CH (Глина высокой пластичности)</option>
                  <option value="CL-ML">CL-ML (Илистая глина)</option>
                </select>
              </div>

              <div>
                <label className={styles.label}>% содержания гравия (для описания)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.gravelContent}
                  onChange={(e) => handleInputChange('gravelContent', e.target.value)}
                  className={styles.input}
                  placeholder="0-100"
                />
              </div>
            </>
          )}

          <button onClick={classifySoil} className={styles.button}>
            Классифицировать грунт
          </button>

          {result && (
            <div className={result.error ? styles.errorBox : styles.successBox}>
              {result.error ? (
                <p className={styles.errorText}>{result.error}</p>
              ) : (
                <div>
                  <p className={styles.resultLabel}>Результат классификации:</p>
                  <p className={styles.resultText}>{result.classification}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.note}>
            <strong>Примечание:</strong> Эта версия классифицирует только песчаные грунты (% песка &gt; % гравия).
            Для полной классификации по ASTM D2487-17 требуется расширение логики.
          </p>
        </div>
      </div>
    </div>
  );
}