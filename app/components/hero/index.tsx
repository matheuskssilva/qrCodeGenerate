"use client"

import React, { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toPng } from "html-to-image"
import { saveAs } from "file-saver"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { MdDeleteForever, MdModeEdit } from "react-icons/md"
import { IoMdDownload } from "react-icons/io"

interface QRCodeData {
  title: string
  url: string
}

export const Hero = () => {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const itemsPerPage = 3

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qrCodes")
      if (saved) {
        setQrCodes(JSON.parse(saved))
      }
    }
  }, [])

  const validateURL = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (_) {
      return false
    }
  }

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length > maxLength) {
      return `${url.slice(0, maxLength - 3)}...`
    }
    return url
  }

  const generateQRCode = async () => {
    if (url.trim() === "") {
      setError("A URL não pode estar vazia.")
      return
    }

    if (!validateURL(url)) {
      setError("A URL fornecida não é válida.")
      return
    }

    if (url.length > 300) {
      setError("A URL é muito longa para ser codificada em um QR code.")
      return
    }

    setIsLoading(true)

    const newQRCode: QRCodeData = { title, url }
    let updatedQRCodes

    if (editIndex !== null) {
      updatedQRCodes = qrCodes.map((code, index) =>
        index === editIndex ? newQRCode : code
      )
      setEditIndex(null)
    } else {
      updatedQRCodes = [...qrCodes, newQRCode]
    }

    setQrCodes(updatedQRCodes)
    if (typeof window !== "undefined") {
      localStorage.setItem("qrCodes", JSON.stringify(updatedQRCodes))
    }
    setError(null)

    try {
      await fetch("/api/saveQRCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQRCode),
      })
    } catch (err) {
      setError("Erro ao salvar o QR code.")
    } finally {
      setIsLoading(false)
    }

    setTitle("")
    setUrl("")
  }

  const removeQrCode = async () => {
    if (deletingIndex === null) return

    const updatedQRCodes = qrCodes.filter((_, index) => index !== deletingIndex)
    setQrCodes(updatedQRCodes)
    if (typeof window !== "undefined") {
      localStorage.setItem("qrCodes", JSON.stringify(updatedQRCodes))
    }

    try {
      await fetch("/api/removeQRCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ index: deletingIndex }),
      })
    } catch (err) {
      setError("Erro ao remover o QR code.")
    } finally {
      setDeletingIndex(null) 
    }
  }

  const startEditing = (index: number) => {
    const qrCodeToEdit = qrCodes[index]
    setTitle(qrCodeToEdit.title)
    setUrl(qrCodeToEdit.url)
    setEditIndex(index)
  }

  const totalPages = Math.ceil(qrCodes.length / itemsPerPage)
  const paginatedQRCodes = qrCodes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDownloadQrCode = async (index: number) => {
    const qrCodeElement = document.getElementById(`qrcode-${index}`)
    if (qrCodeElement) {
      try {
        const qrCodeImage = await toPng(qrCodeElement, {
          canvasWidth: 1500,
          canvasHeight: 1500,
          backgroundColor: "#ffffff",
        })

        const fileName = `qrcode-${index}-${Date.now()}.png`
        saveAs(qrCodeImage, fileName)
      } catch (error) {
        console.error("Failed to download QR code:", error)
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-center max-w-[800px] w-full gap-4 mt-20">
        <Input
          type="text"
          placeholder="Digite um Titulo (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Digite a URL Desejada"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button onClick={generateQRCode} disabled={isLoading}>
          {isLoading ? "Gerando..." : editIndex !== null ? "Salvar" : "Gerar"}
        </Button>
      </div>
      {error && (
        <div className="text-red-500 mt-4 text-center">{error}</div>
      )}
      <div className="flex flex-col gap-4 mt-20 relative">
        {paginatedQRCodes.map((qrCode, index) => (
          <div key={index} className="flex w-full">
            <Card className="text-center w-[800px] flex">
              <div id={`qrcode-${index}`}>
                <QRCodeSVG
                  value={qrCode.url}
                  size={150}
                  style={{ margin: "10px" }}
                />
              </div>
              <div className="flex mt-4">
                <div className="flex flex-col gap-10 mt-3">
                  <h2 className="max-w-60 w-fit">Titulo: <span className="font-bold">{qrCode.title}</span></h2>
                  <h2>Url: <span className="font-bold">{truncateUrl(qrCode.url)}</span></h2>
                </div>
              
                <div className="flex gap-2 ml-[150px] fixed left-[53%]">
                  <Button variant="outline" className="text-xl" onClick={() => startEditing(index)}>
                    <MdModeEdit />
                  </Button>
                  <Button variant="outline" className="bg-green-500 text-xl" onClick={() => handleDownloadQrCode(index)}>
                    <IoMdDownload />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" onClick={() => setDeletingIndex(index)}>
                        <MdDeleteForever className="text-xl" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza que deseja excluir o Qr Code?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Caso escolha em excluir o QrCode será uma ação permanente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingIndex(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeQrCode()}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
      {qrCodes.length > itemsPerPage && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(Math.max(currentPage - 1, 1))
                }}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === index + 1}
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(index + 1)
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  )
}
