const { createWorker } = require("tesseract.js");

let workerPromise = null;
let queue = Promise.resolve();

const getWorker = async () => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("por");
      await worker.setParameters({
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      return worker;
    })();
  }

  return workerPromise;
};

const runQueued = (fn) => {
  const next = queue.then(fn);
  queue = next.catch(() => {});
  return next;
};

const ocrImage = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: "Imagem obrigatoria" });
  }

  try {
    const text = await runQueued(async () => {
      const worker = await getWorker();
      const result = await worker.recognize(req.file.buffer);
      return result?.data?.text || "";
    });

    return res.json({ text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("OCR server error:", error);
    return res.status(500).json({ error: msg || "Falha no OCR" });
  }
};

module.exports = { ocrImage };
